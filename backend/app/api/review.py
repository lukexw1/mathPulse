"""Review (SM-2 spaced repetition) endpoints."""

from fastapi import APIRouter, Header
from pydantic import BaseModel

from app.core.supabase import get_supabase
from app.schemas.common import ApiResponse
from app.schemas.question import _build_question_out
from app.services.sm2 import recalculate_sm2

router = APIRouter()


@router.get("/due", response_model=ApiResponse)
async def get_due_reviews(x_user_id: int = Header(...)) -> ApiResponse:
    """Return questions due for review (SM-2).

    FR-25: Questions where next_review <= today.
    """
    db = get_supabase()

    # Get progress entries due for review
    progress_result = (
        db.table("user_question_progress")
        .select("question_id")
        .eq("user_id", x_user_id)
        .lte("next_review", "now()")
        .limit(20)
        .execute()
    )

    if not progress_result.data:
        return ApiResponse(data=[], message="Нет задач на повторение!")

    question_ids = [p["question_id"] for p in progress_result.data]

    # Fetch questions
    questions_result = (
        db.table("questions")
        .select("*")
        .in_("id", question_ids)
        .execute()
    )

    question_list = [_build_question_out(q).model_dump() for q in questions_result.data]

    return ApiResponse(data=question_list)


class ReviewRating(BaseModel):
    """User's self-assessment after reviewing a question."""

    quality: int  # 0-5 (SM-2 quality scale)


@router.post("/{question_id}/rate", response_model=ApiResponse)
async def rate_review(
    question_id: str,
    body: ReviewRating,
    x_user_id: int = Header(...),
) -> ApiResponse:
    """Rate a review session (SM-2 quality 0-5).

    FR-24, FR-26: Recalculate SM-2 parameters.
    If quality < 3, reset interval to 1 day.
    """
    if not 0 <= body.quality <= 5:
        return ApiResponse(error="Оценка должна быть от 0 до 5")

    db = get_supabase()
    recalculate_sm2(db, x_user_id, question_id, body.quality)

    return ApiResponse(message="Оценка сохранена")
