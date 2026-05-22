"""Dashboard endpoint — single API call for home screen data."""

import logging
import traceback
from pathlib import Path

from fastapi import APIRouter, Header, HTTPException

from app.core.supabase import get_supabase
from app.schemas.common import ApiResponse
from app.schemas.dashboard import DashboardResponse, NextTheoryTopic, TopicProgress
from app.utils.markdown_parser import list_all_theory_articles

logger = logging.getLogger(__name__)
router = APIRouter()

TOPICS = ["algebra", "geometry", "statistics", "advanced_math"]
XP_PER_LEVEL = 500
THEORY_DIR = Path(__file__).parent.parent.parent.parent / "theory" / "articles"


@router.get("/dashboard", response_model=ApiResponse)
async def get_dashboard(x_user_id: int = Header(...)) -> ApiResponse:
    """Return all data needed for the home screen.

    FR-33, FR-34, FR-35: Level, XP, streak, topic progress, review count.
    Single API call, loads in <2s.
    """
    try:
        db = get_supabase()

        # Get user
        user_result = db.table("users").select("*").eq("id", x_user_id).single().execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="Пользователь не найден")

        user = user_result.data
        xp = user.get("xp", 0)
        level = user.get("level", 1)

        # Topic progress: solved questions vs total available
        topics: list[TopicProgress] = []
        for topic in TOPICS:
            # Total questions in this topic
            total_q_result = (
                db.table("questions")
                .select("id", count="exact")
                .eq("topic", topic)
                .execute()
            )
            total_questions = total_q_result.count or 0

            # Distinct questions the user answered correctly
            solved_result = (
                db.table("question_attempts")
                .select("question_id, questions!inner(topic)")
                .eq("user_id", x_user_id)
                .eq("is_correct", True)
                .eq("questions.topic", topic)
                .execute()
            )
            solved_ids = {r["question_id"] for r in solved_result.data}
            solved = len(solved_ids)

            accuracy = solved / total_questions if total_questions > 0 else 0.0
            topics.append(TopicProgress(
                topic=topic,
                solved=solved,
                total_questions=total_questions,
                accuracy=round(accuracy, 2),
            ))

        # Review due count
        review_result = (
            db.table("user_question_progress")
            .select("*", count="exact")
            .eq("user_id", x_user_id)
            .lte("next_review", "now()")
            .execute()
        )
        review_due_count = review_result.count or 0

        # Total solved
        total_result = (
            db.table("question_attempts")
            .select("*", count="exact")
            .eq("user_id", x_user_id)
            .execute()
        )
        total_solved = total_result.count or 0

        # Find next unlearned theory topic
        next_unlearned_topic = None
        try:
            # Get all theory articles
            all_articles = list_all_theory_articles(THEORY_DIR)
            
            # Get user's completed theory topics
            completed_progress = (
                db.table("user_theory_progress")
                .select("subtopic")
                .eq("user_id", x_user_id)
                .eq("completed", True)
                .execute()
            )
            completed_subtopics = {row["subtopic"] for row in completed_progress.data}
            
            # Find first unlearned topic
            for article in all_articles:
                if article["subtopic"] not in completed_subtopics:
                    next_unlearned_topic = NextTheoryTopic(
                        subtopic=article["subtopic"],
                        title=article["title"],
                        estimated_minutes=article["estimated_minutes"],
                    )
                    break
        except Exception as e:
            logger.warning("Failed to fetch next unlearned topic: %s", e)
            # Continue without next_unlearned_topic (will be None)

        dashboard = DashboardResponse(
            xp=xp,
            level=level,
            xp_to_next_level=XP_PER_LEVEL - (xp % XP_PER_LEVEL),
            streak_days=user.get("streak_days", 0),
            streak_record=user.get("streak_record", 0),
            review_due_count=review_due_count,
            topics=topics,
            total_solved=total_solved,
            next_unlearned_topic=next_unlearned_topic,
        )

        return ApiResponse(data=dashboard.model_dump())

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Dashboard error for user %s: %s\n%s", x_user_id, e, traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Server error: {type(e).__name__}: {e}",
        )
