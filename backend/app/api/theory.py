"""Theory API endpoints — theory articles, progress tracking, and quizzes."""

from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException

from app.core.supabase import get_supabase
from app.schemas.common import ApiResponse
from app.schemas.theory import (
    QuizResult,
    QuizSubmitRequest,
    QuizSubmitResponse,
    TheoryArticleResponse,
    TheoryListResponse,
    TheoryProgress,
)
from app.services.gamification import award_xp, check_achievements
from app.utils.markdown_parser import list_all_theory_articles, load_theory_article

router = APIRouter()

# Path to theory articles directory
# __file__ = backend/app/api/theory.py
# .parent = backend/app/api
# .parent.parent = backend/app
# .parent.parent.parent = backend
# .parent.parent.parent.parent = project root
THEORY_DIR = Path(__file__).parent.parent.parent.parent / "theory" / "articles"


@router.get("/theory", response_model=ApiResponse)
async def list_theory_articles(x_user_id: int = Header(...)) -> ApiResponse:
    """List all theory articles with user progress.

    Returns:
        ApiResponse with TheoryListResponse data
    """
    db = get_supabase()

    # Load all articles from markdown files
    try:
        articles_metadata = list_all_theory_articles(THEORY_DIR)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load theory articles: {e}")

    # Fetch user progress for all subtopics
    progress_rows = (
        db.table("user_theory_progress")
        .select("subtopic, completed, best_score")
        .eq("user_id", x_user_id)
        .execute()
    )

    progress_map = {row["subtopic"]: row for row in progress_rows.data}

    # Merge metadata with progress
    articles = []
    for meta in articles_metadata:
        subtopic = meta["subtopic"]
        prog = progress_map.get(subtopic, {})

        articles.append(
            {
                "subtopic": subtopic,
                "title": meta["title"],
                "estimated_minutes": meta["estimated_minutes"],
                "completed": prog.get("completed", False),
                "best_score": prog.get("best_score"),
            }
        )

    return ApiResponse(data=TheoryListResponse(articles=articles))


@router.get("/theory/{subtopic}", response_model=ApiResponse)
async def get_theory_article(subtopic: str, x_user_id: int = Header(...)) -> ApiResponse:
    """Get full theory article with content and user progress.

    Args:
        subtopic: Subtopic identifier (e.g., 'linear_equations')
        x_user_id: User ID from header

    Returns:
        ApiResponse with TheoryArticleResponse data
    """
    db = get_supabase()

    # Load article from markdown
    try:
        article_data = load_theory_article(subtopic, THEORY_DIR)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Theory article not found: {subtopic}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load article: {e}")

    # Fetch user progress
    progress_row = (
        db.table("user_theory_progress")
        .select("*")
        .eq("user_id", x_user_id)
        .eq("subtopic", subtopic)
        .maybe_single()
        .execute()
    )

    progress = None
    if progress_row and progress_row.data:
        progress = TheoryProgress(**progress_row.data)

    return ApiResponse(
        data=TheoryArticleResponse(
            subtopic=article_data["subtopic"],
            title=article_data["title"],
            content_md=article_data["content_md"],
            estimated_minutes=article_data["estimated_minutes"],
            progress=progress,
            quiz_questions=article_data["quiz_questions"],
        )
    )


@router.post("/theory/{subtopic}/quiz", response_model=ApiResponse)
async def submit_theory_quiz(
    subtopic: str,
    request: QuizSubmitRequest,
    background_tasks: BackgroundTasks,
    x_user_id: int = Header(...),
) -> ApiResponse:
    """Submit quiz answers and update progress.

    Args:
        subtopic: Subtopic identifier
        request: Quiz answers (question_id -> selected_option_index)
        background_tasks: FastAPI background tasks
        x_user_id: User ID from header

    Returns:
        ApiResponse with QuizSubmitResponse data
    """
    db = get_supabase()

    # Load article to get quiz question IDs
    try:
        article_data = load_theory_article(subtopic, THEORY_DIR)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Theory article not found: {subtopic}")

    quiz_question_ids = article_data["quiz_questions"]

    if len(quiz_question_ids) != 5:
        raise HTTPException(status_code=500, detail="Quiz must have exactly 5 questions")

    # Fetch quiz questions from DB
    questions_response = (
        db.table("questions").select("id, correct_answer, choices").in_("id", quiz_question_ids).execute()
    )

    if len(questions_response.data) != 5:
        raise HTTPException(status_code=500, detail="Quiz questions not found in database")

    questions_map = {q["id"]: q for q in questions_response.data}

    # Grade quiz
    results = []
    correct_count = 0

    for question_id in quiz_question_ids:
        if question_id not in request.answers:
            raise HTTPException(status_code=400, detail=f"Missing answer for question: {question_id}")

        selected_index = request.answers[question_id]
        question = questions_map[question_id]
        correct_answer_label = question["correct_answer"]  # e.g., "B"
        
        # Find the correct index from choices
        correct_index = 0
        if question.get("choices"):
            for idx, choice in enumerate(question["choices"]):
                if choice["label"] == correct_answer_label:
                    correct_index = idx
                    break
        
        is_correct = selected_index == correct_index

        if is_correct:
            correct_count += 1

        results.append(
            QuizResult(
                question_id=question_id,
                correct=is_correct,
                selected_index=selected_index,
                correct_index=correct_index,
            )
        )

    # Calculate score and pass status
    score = correct_count
    percentage = (score * 100) // 5
    passed = percentage >= 60

    # XP reward: 50 XP base + 10 XP per correct answer
    xp_earned = 50 + (score * 10)

    # Update user_theory_progress
    existing_progress = (
        db.table("user_theory_progress")
        .select("*")
        .eq("user_id", x_user_id)
        .eq("subtopic", subtopic)
        .maybe_single()
        .execute()
    )

    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()

    if existing_progress and existing_progress.data:
        # Update existing progress
        best_score = max(existing_progress.data.get("best_score") or 0, score)
        completed = existing_progress.data.get("completed", False) or passed
        completed_at = existing_progress.data.get("completed_at")

        if passed and not existing_progress.data.get("completed"):
            # First time passing
            completed_at = now

        db.table("user_theory_progress").update(
            {
                "quiz_score": score,
                "quiz_attempts": existing_progress.data["quiz_attempts"] + 1,
                "best_score": best_score,
                "completed": completed,
                "completed_at": completed_at,
                "last_attempt_at": now,
            }
        ).eq("user_id", x_user_id).eq("subtopic", subtopic).execute()
    else:
        # Insert new progress
        db.table("user_theory_progress").insert(
            {
                "user_id": x_user_id,
                "subtopic": subtopic,
                "quiz_score": score,
                "quiz_attempts": 1,
                "best_score": score,
                "completed": passed,
                "completed_at": now if passed else None,
                "last_attempt_at": now,
            }
        ).execute()

    # Award XP
    award_xp(db, x_user_id, xp_earned)

    # Check for badge unlocks in background
    background_tasks.add_task(check_achievements, db, x_user_id)

    return ApiResponse(
        data=QuizSubmitResponse(
            score=score,
            total=5,
            percentage=percentage,
            passed=passed,
            results=results,
            xp_earned=xp_earned,
            new_badges=[],  # TODO: Implement badge checking logic
        )
    )
