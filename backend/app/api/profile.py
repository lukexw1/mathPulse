"""Profile and statistics endpoints."""

import logging
import traceback

from fastapi import APIRouter, Header, HTTPException

from app.core.supabase import get_supabase
from app.schemas.common import ApiResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/profile", response_model=ApiResponse)
async def get_profile(x_user_id: int = Header(...)) -> ApiResponse:
    """Return full user profile with stats and achievements.

    FR-36: Name, total stats, achievements, per-topic progress.
    """
    try:
        db = get_supabase()

        # User data
        user_result = db.table("users").select("*").eq("id", x_user_id).single().execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        user = user_result.data

        # Total stats
        attempts_result = (
            db.table("question_attempts")
            .select("is_correct", count="exact")
            .eq("user_id", x_user_id)
            .execute()
        )
        total_attempts = attempts_result.count or 0
        correct_count = sum(1 for a in attempts_result.data if a["is_correct"])
        accuracy = correct_count / total_attempts if total_attempts > 0 else 0

        # Achievements
        achievements_result = (
            db.table("user_achievements")
            .select("achievements(*)")
            .eq("user_id", x_user_id)
            .execute()
        )
        achievements = [
            {
                "code": a["achievements"]["code"],
                "title": a["achievements"]["title"],
                "description": a["achievements"]["description"],
            }
            for a in achievements_result.data
        ] if achievements_result.data else []

        # Per-topic progress: solved vs total available
        # FR-36: Include subtopic-level breakdown
        topics = {}
        for topic in ["algebra", "geometry", "statistics", "advanced_math"]:
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
                .select("question_id, questions!inner(topic, subtopic)")
                .eq("user_id", x_user_id)
                .eq("is_correct", True)
                .eq("questions.topic", topic)
                .execute()
            )
            solved_ids = {r["question_id"] for r in solved_result.data}
            solved = len(solved_ids)

            # FR-36: Subtopic breakdown — solved (unique correct) / total questions per subtopic

            # Total questions per subtopic
            subtopic_totals_result = (
                db.table("questions")
                .select("id, subtopic")
                .eq("topic", topic)
                .execute()
            )
            subtopic_total_map: dict[str, int] = {}
            for q in subtopic_totals_result.data:
                sub = q.get("subtopic", "") or ""
                subtopic_total_map[sub] = subtopic_total_map.get(sub, 0) + 1

            # Unique questions solved correctly per subtopic
            subtopic_solved_map: dict[str, set[str]] = {}
            for r in solved_result.data:
                sub = r.get("questions", {}).get("subtopic", "") or ""
                if sub not in subtopic_solved_map:
                    subtopic_solved_map[sub] = set()
                subtopic_solved_map[sub].add(r["question_id"])

            subtopics = {}
            for sub, total_q in subtopic_total_map.items():
                sub_solved = len(subtopic_solved_map.get(sub, set()))
                subtopics[sub] = {
                    "solved": sub_solved,
                    "total_questions": total_q,
                    "accuracy": round(sub_solved / total_q, 2) if total_q > 0 else 0,
                }

            topics[topic] = {
                "solved": solved,
                "total_questions": total_questions,
                "accuracy": round(solved / total_questions, 2) if total_questions > 0 else 0,
                "subtopics": subtopics,
            }

        profile_data = {
            "id": user["id"],
            "first_name": user["first_name"],
            "username": user.get("username"),
            "xp": user.get("xp", 0),
            "level": user.get("level", 1),
            "streak_days": user.get("streak_days", 0),
            "total_solved": total_attempts,
            "accuracy": round(accuracy, 2),
            "achievements": achievements,
            "topics": topics,
        }

        return ApiResponse(data=profile_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Profile error for user %s: %s\n%s", x_user_id, e, traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Server error: {type(e).__name__}: {e}",
        )


@router.get("/stats/summary", response_model=ApiResponse)
async def get_stats_summary(x_user_id: int = Header(...)) -> ApiResponse:
    """Brief stats for the bot /stats command.

    FR-2: Level, XP, streak, total solved.
    """
    try:
        db = get_supabase()

        user_result = db.table("users").select("*").eq("id", x_user_id).single().execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="Пользователь не найден")

        user = user_result.data

        attempts_result = (
            db.table("question_attempts")
            .select("id", count="exact")
            .eq("user_id", x_user_id)
            .execute()
        )

        return ApiResponse(data={
            "level": user.get("level", 1),
            "xp": user.get("xp", 0),
            "streak_days": user.get("streak_days", 0),
            "streak_record": user.get("streak_record", 0),
            "total_solved": attempts_result.count or 0,
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Stats summary error for user %s: %s\n%s", x_user_id, e, traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Server error: {type(e).__name__}: {e}",
        )
