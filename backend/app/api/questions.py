"""Question engine endpoints — adaptive question selection and answering."""

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Query, Request
from pydantic import BaseModel

from app.core.supabase import get_supabase
from app.schemas.common import ApiResponse
from app.schemas.question import (
    AnswerRequest,
    AnswerResult,
    Choice,
    QuestionOut,
    SolutionStep,
    _build_question_out,
)
from app.services.adaptive import get_next_question_id, update_difficulty
from app.services.gamification import award_xp, check_achievements
from app.services.sm2 import update_sm2_on_answer

router = APIRouter()


@router.get("/next", response_model=ApiResponse)
async def get_next_question(
    x_user_id: int = Header(...),
    exclude: str = Query("", description="Comma-separated question IDs to exclude (session)"),
) -> ApiResponse:
    """Return the next question based on adaptive difficulty.

    FR-20, FR-21, FR-22: Adaptive selection — 60% weak topics,
    30% SM-2 review, 10% random/new.

    The `exclude` parameter accepts a comma-separated list of question IDs
    that the frontend has already shown in the current session. This prevents
    back-to-back repetition even before answers are submitted.
    """
    db = get_supabase()

    # Parse session exclusion list from frontend
    session_exclude: set[str] = set()
    if exclude:
        session_exclude = {qid.strip() for qid in exclude.split(",") if qid.strip()}

    question_id = await get_next_question_id(db, x_user_id, session_exclude)

    if question_id is None:
        return ApiResponse(error="Нет доступных задач")

    result = db.table("questions").select("*").eq("id", question_id).single().execute()
    if not result.data:
        return ApiResponse(error="Задача не найдена")

    question = _build_question_out(result.data)
    return ApiResponse(data=question.model_dump())


@router.get("/batch", response_model=ApiResponse)
async def get_question_batch(
    x_user_id: int = Header(...),
    count: int = Query(12, ge=1, le=30, description="Number of questions to fetch"),
) -> ApiResponse:
    """Return a batch of questions for a full practice session.

    Calls the adaptive selection engine repeatedly, accumulating
    exclusions so each question in the batch is unique. Returns
    as many questions as available (may be fewer than `count`).
    """
    db = get_supabase()
    session_exclude: set[str] = set()
    questions: list[dict] = []

    for _ in range(count):
        question_id = await get_next_question_id(db, x_user_id, session_exclude)
        if question_id is None:
            break  # No more questions available

        result = db.table("questions").select("*").eq("id", question_id).single().execute()
        if not result.data:
            continue

        questions.append(_build_question_out(result.data).model_dump())
        session_exclude.add(question_id)

    if not questions:
        return ApiResponse(error="Нет доступных задач")

    return ApiResponse(data=questions)


@router.get("/by-ids", response_model=ApiResponse)
async def get_questions_by_ids(
    ids: str = Query(..., description="Comma-separated question IDs"),
    x_user_id: int = Header(...),
) -> ApiResponse:
    """Get specific questions by their IDs (for theory quizzes).
    
    Args:
        ids: Comma-separated list of question IDs
        x_user_id: User ID from header
        
    Returns:
        List of questions (without correct answers)
    """
    db = get_supabase()
    question_ids = [qid.strip() for qid in ids.split(",") if qid.strip()]
    
    if not question_ids:
        return ApiResponse(error="No question IDs provided")
    
    # Fetch questions
    result = db.table("questions").select("*").in_("id", question_ids).execute()
    
    if not result.data:
        return ApiResponse(error="Questions not found")
    
    # Build question objects (without correct answers)
    questions = [_build_question_out(q).model_dump() for q in result.data]
    
    return ApiResponse(data=questions)


@router.post("/{question_id}/answer", response_model=ApiResponse)
async def submit_answer(
    question_id: str,
    body: AnswerRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    x_user_id: int = Header(...),
) -> ApiResponse:
    """Submit an answer, get solution, update progress.

    FR-16, FR-17, FR-18: Show solution steps, record hint usage, measure time.
    FR-27, FR-28: Award XP, check level up.
    FR-23, FR-24: Update SM-2 progress.
    """
    db = get_supabase()

    # Get question with correct answer
    q_result = db.table("questions").select("*").eq("id", question_id).single().execute()
    if not q_result.data:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    question = q_result.data
    is_correct = body.answer.strip().lower() == question["correct_answer"].strip().lower()

    # Record attempt (FR-18)
    db.table("question_attempts").insert({
        "user_id": x_user_id,
        "question_id": question_id,
        "is_correct": is_correct,
        "answer_given": body.answer,
        "time_spent_ms": body.time_spent_ms,
        "hint_used": body.hint_used,
    }).execute()

    # Award XP (FR-27)
    xp_earned = 0
    if is_correct:
        xp_earned = award_xp(db, x_user_id, question["difficulty"])

    # Update adaptive difficulty (FR-20, FR-21)
    try:
        await update_difficulty(db, x_user_id, question["topic"])
    except Exception:
        pass  # Non-critical: don't block answer submission

    # Update SM-2 (FR-23)
    quality = 5 if is_correct and not body.hint_used else (3 if is_correct else 1)
    try:
        update_sm2_on_answer(db, x_user_id, question_id, quality)
    except Exception:
        pass  # Non-critical: don't block answer submission

    # Get updated user for response
    user_result = db.table("users").select("xp, level").eq("id", x_user_id).single().execute()
    user = user_result.data

    # Solution steps are now handled by i18n on the frontend
    # We return the question_key so frontend can look them up from i18n files
    result = AnswerResult(
        is_correct=is_correct,
        correct_answer=question["correct_answer"],
        question_key=question.get("question_key", ""),
        solution_steps=[],  # Empty - frontend will get from i18n using question_key
        xp_earned=xp_earned,
        new_total_xp=user["xp"] if user else 0,
        new_level=user["level"] if user else 1,
        achievement_earned=None,  # Will be set by background task if earned
    )

    # Check achievements in background (FR-31) - non-blocking
    background_tasks.add_task(_check_achievements_background, db, x_user_id)

    return ApiResponse(data=result.model_dump())


def _check_achievements_background(db, user_id: int):
    """Background task to check achievements without blocking response."""
    try:
        check_achievements(db, user_id)
    except Exception:
        pass  # Non-critical
