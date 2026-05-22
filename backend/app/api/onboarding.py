"""Onboarding endpoints — goal selection and initial assessment."""

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from app.core.supabase import get_supabase
from app.schemas.common import ApiResponse
from app.schemas.question import _build_question_out

router = APIRouter()


class GoalRequest(BaseModel):
    """Request body for setting user goal."""

    goal: str  # "sat" | "general"


@router.post("/goal", response_model=ApiResponse)
async def set_goal(body: GoalRequest, x_user_id: int = Header(...)) -> ApiResponse:
    """Save user's chosen goal.

    FR-10: First-time goal selection (SAT or General Practice).
    """
    if body.goal not in ("sat", "general"):
        raise HTTPException(status_code=400, detail="Неверная цель")

    db = get_supabase()
    db.table("users").update({"goal": body.goal}).eq("id", x_user_id).execute()

    return ApiResponse(message="Цель сохранена", data={"goal": body.goal})


@router.get("/test", response_model=ApiResponse)
async def get_onboarding_test(x_user_id: int = Header(...)) -> ApiResponse:
    """Return 5 questions of varying difficulty for initial assessment.

    FR-11: 1 easy, 2 medium, 1 hard, 1 very hard from different topics.
    """
    db = get_supabase()

    questions: list[dict] = []
    # FR-11: 1 easy, 2 medium, 1 hard, 1 very hard → [1, 3, 3, 4, 5]
    difficulties = [1, 3, 3, 4, 5]
    # Enforce different topics for each question
    all_topics = ["algebra", "geometry", "statistics", "advanced_math"]
    used_topics: list[str] = []

    for diff in difficulties:
        # Try to pick a topic not yet used; fallback to any if all used
        available_topics = [t for t in all_topics if t not in used_topics] or all_topics

        found = False
        for topic in available_topics:
            result = (
                db.table("questions")
                .select("*")
                .eq("difficulty", diff)
                .eq("topic", topic)
                .limit(1)
                .execute()
            )
            if result.data:
                questions.append(result.data[0])
                used_topics.append(topic)
                found = True
                break

        # Fallback: any topic at this difficulty if preferred topics exhausted
        if not found:
            result = (
                db.table("questions")
                .select("*")
                .eq("difficulty", diff)
                .limit(1)
                .execute()
            )
            if result.data:
                questions.append(result.data[0])
                used_topics.append(result.data[0]["topic"])

    # Convert to QuestionOut (hide correct answer)
    question_list = [_build_question_out(q) for q in questions]

    return ApiResponse(data=[q.model_dump() for q in question_list])


class OnboardingResult(BaseModel):
    """Results from the onboarding mini-test."""

    answers: list[dict]  # [{"question_id": "...", "answer": "...", "is_correct": bool}]


@router.post("/result", response_model=ApiResponse)
async def submit_onboarding_result(
    body: OnboardingResult,
    x_user_id: int = Header(...),
) -> ApiResponse:
    """Process onboarding mini-test results and set initial difficulty.

    FR-12, FR-13: Calculate initial difficulty per topic from mini-test results.
    """
    db = get_supabase()

    # Calculate accuracy per topic
    topic_results: dict[str, list[bool]] = {}

    for answer in body.answers:
        # Get question to find its topic
        q_result = (
            db.table("questions")
            .select("topic")
            .eq("id", answer["question_id"])
            .single()
            .execute()
        )
        if q_result.data:
            topic = q_result.data["topic"]
            if topic not in topic_results:
                topic_results[topic] = []
            topic_results[topic].append(answer.get("is_correct", False))

    # Set initial difficulty: correct = start at difficulty 3, wrong = start at 1
    initial_levels: dict[str, int] = {}
    for topic, results in topic_results.items():
        accuracy = sum(results) / len(results) if results else 0
        if accuracy >= 0.8:
            initial_levels[topic] = 4
        elif accuracy >= 0.5:
            initial_levels[topic] = 3
        elif accuracy >= 0.2:
            initial_levels[topic] = 2
        else:
            initial_levels[topic] = 1

    # Default topics not tested
    for t in ["algebra", "geometry", "statistics", "advanced_math"]:
        if t not in initial_levels:
            initial_levels[t] = 2  # Default: easy-medium

    # Store in user profile (as JSON field or separate table)
    db.table("users").update({
        "onboarding_complete": True,
        "topic_levels": initial_levels,
    }).eq("id", x_user_id).execute()

    return ApiResponse(
        data={"initial_levels": initial_levels},
        message="Мини-тест завершён! Начинаем!",
    )
