"""Gamification service — XP, levels, streaks, achievements.

FR-27: XP per correct answer: +10 (diff 1-2), +25 (diff 3), +50 (diff 4-5)
FR-28: Level up every 500 XP
FR-29: Streak: +1 if >= 5 questions solved today (UTC+5)
FR-31: 5 achievements
"""

from datetime import datetime, timezone, timedelta

from supabase import Client

XP_PER_LEVEL = 500
TASHKENT_TZ = timezone(timedelta(hours=5))

# XP by difficulty
XP_TABLE = {
    1: 10,
    2: 10,
    3: 25,
    4: 50,
    5: 50,
}

# Achievement definitions
ACHIEVEMENTS = {
    "first_correct": {
        "check": "_check_first_correct",
        "title": "Первый шаг",
        "description": "Первая правильно решённая задача",
    },
    "streak_3": {
        "check": "_check_streak_3",
        "title": "3 дня подряд",
        "description": "Стрик 3 дня",
    },
    "streak_7": {
        "check": "_check_streak_7",
        "title": "Неделя силы",
        "description": "Стрик 7 дней",
    },
    "topic_master": {
        "check": "_check_topic_master",
        "title": "Мастер темы",
        "description": "90%+ точность в одной теме (мин. 20 задач)",
    },
    "speed_demon": {
        "check": "_check_speed_demon",
        "title": "Скоростной демон",
        "description": "5 задач подряд за <30 секунд каждая",
    },
}


def award_xp(db: Client, user_id: int, difficulty: int) -> int:
    """Award XP for a correct answer and check level up.

    Args:
        db: Supabase client.
        user_id: Telegram user ID.
        difficulty: Question difficulty (1-5).

    Returns:
        XP earned.
    """
    xp_earned = XP_TABLE.get(difficulty, 10)

    # Get current user
    result = db.table("users").select("xp, level").eq("id", user_id).single().execute()
    if not result.data:
        return 0

    current_xp = result.data["xp"]
    new_xp = current_xp + xp_earned
    new_level = (new_xp // XP_PER_LEVEL) + 1

    # Update user
    db.table("users").update({
        "xp": new_xp,
        "level": new_level,
    }).eq("id", user_id).execute()

    # Update streak
    _update_streak(db, user_id)

    return xp_earned


def _update_streak(db: Client, user_id: int) -> None:
    """Update user's streak based on today's activity (UTC+5).

    FR-29: +1 if >= 5 questions solved today, reset if day missed.
    """
    now_tashkent = datetime.now(TASHKENT_TZ)
    today = now_tashkent.date()

    # Count today's attempts
    start_of_day = datetime(today.year, today.month, today.day, tzinfo=TASHKENT_TZ)
    attempts_result = (
        db.table("question_attempts")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .gte("created_at", start_of_day.isoformat())
        .execute()
    )

    today_count = attempts_result.count or 0

    # Get user's current streak info
    user_result = (
        db.table("users")
        .select("streak_days, last_active, streak_record")
        .eq("id", user_id)
        .single()
        .execute()
    )
    user = user_result.data
    last_active = user.get("last_active")
    current_streak = user.get("streak_days", 0)
    streak_record = user.get("streak_record", 0)

    if today_count >= 5:
        if last_active:
            from datetime import date as date_type

            last_date = (
                date_type.fromisoformat(last_active)
                if isinstance(last_active, str)
                else last_active
            )
            days_diff = (today - last_date).days

            if days_diff == 0:
                # Already counted today
                return
            elif days_diff == 1:
                # Consecutive day
                current_streak += 1
            else:
                # Streak broken
                current_streak = 1
        else:
            current_streak = 1

        streak_record = max(streak_record, current_streak)

        db.table("users").update({
            "streak_days": current_streak,
            "streak_record": streak_record,
            "last_active": today.isoformat(),
        }).eq("id", user_id).execute()


def check_achievements(db: Client, user_id: int) -> str | None:
    """Check if user earned a new achievement.

    FR-31, FR-32: Check all 5 achievements, return first new one earned.

    Returns:
        Achievement code if newly earned, None otherwise.
    """
    # Get user's existing achievements
    existing_result = (
        db.table("user_achievements")
        .select("achievements(code)")
        .eq("user_id", user_id)
        .execute()
    )
    existing_codes = set()
    if existing_result.data:
        for a in existing_result.data:
            if a.get("achievements"):
                existing_codes.add(a["achievements"]["code"])

    # Check each achievement
    for code in ACHIEVEMENTS:
        if code in existing_codes:
            continue

        earned = False

        if code == "first_correct":
            earned = _check_first_correct(db, user_id)
        elif code == "streak_3":
            earned = _check_streak_n(db, user_id, 3)
        elif code == "streak_7":
            earned = _check_streak_n(db, user_id, 7)
        elif code == "topic_master":
            earned = _check_topic_master(db, user_id)
        elif code == "speed_demon":
            earned = _check_speed_demon(db, user_id)

        if earned:
            # Get achievement ID
            ach_result = (
                db.table("achievements")
                .select("id, xp_reward")
                .eq("code", code)
                .single()
                .execute()
            )
            if ach_result.data:
                # Award achievement
                db.table("user_achievements").insert({
                    "user_id": user_id,
                    "achievement_id": ach_result.data["id"],
                }).execute()

                # Award bonus XP
                if ach_result.data.get("xp_reward"):
                    user_result = (
                        db.table("users")
                        .select("xp")
                        .eq("id", user_id)
                        .single()
                        .execute()
                    )
                    new_xp = user_result.data["xp"] + ach_result.data["xp_reward"]
                    db.table("users").update({"xp": new_xp}).eq("id", user_id).execute()

                return code

    return None


def _check_first_correct(db: Client, user_id: int) -> bool:
    """Check if user has at least 1 correct answer."""
    result = (
        db.table("question_attempts")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("is_correct", True)
        .execute()
    )
    return (result.count or 0) >= 1


def _check_streak_n(db: Client, user_id: int, n: int) -> bool:
    """Check if user has streak >= n days."""
    result = (
        db.table("users")
        .select("streak_days")
        .eq("id", user_id)
        .single()
        .execute()
    )
    return (result.data.get("streak_days", 0) >= n) if result.data else False


def _check_topic_master(db: Client, user_id: int) -> bool:
    """Check if user has 90%+ accuracy in any topic with 20+ attempts."""
    for topic in ["algebra", "geometry", "statistics", "advanced_math"]:
        result = (
            db.table("question_attempts")
            .select("is_correct, questions!inner(topic)")
            .eq("user_id", user_id)
            .eq("questions.topic", topic)
            .execute()
        )
        if result.data and len(result.data) >= 20:
            correct = sum(1 for r in result.data if r["is_correct"])
            if correct / len(result.data) >= 0.9:
                return True
    return False


def _check_speed_demon(db: Client, user_id: int) -> bool:
    """Check if user answered 5 consecutive questions in <30s each."""
    result = (
        db.table("question_attempts")
        .select("time_spent_ms, is_correct")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )
    if not result.data or len(result.data) < 5:
        return False

    return all(
        r["time_spent_ms"] < 30000 and r["is_correct"]
        for r in result.data
    )
