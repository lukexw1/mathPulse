"""Adaptive difficulty engine.

FR-20, FR-21, FR-22: Sliding window of last 5 answers per topic.
- accuracy > 80% AND avg_time < 60s → difficulty + 1 (max 5)
- accuracy < 40% → difficulty - 1 (min 1)
- Otherwise → keep current

Question selection distribution:
- 60% from weak topics (lowest accuracy)
- 30% SM-2 review questions
- 10% random/new topics
"""

import random
from datetime import date

from supabase import Client

TOPICS = ["algebra", "geometry", "statistics", "advanced_math"]


async def update_difficulty(db: Client, user_id: int, topic: str) -> int:
    """Recalculate recommended difficulty for a topic.

    Args:
        db: Supabase client.
        user_id: Telegram user ID.
        topic: The topic to recalculate.

    Returns:
        New difficulty level (1-5).
    """
    # Get last 5 attempts for this topic
    result = (
        db.table("question_attempts")
        .select("is_correct, time_spent_ms, questions!inner(topic)")
        .eq("user_id", user_id)
        .eq("questions.topic", topic)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )

    if not result.data or len(result.data) < 3:
        return 2  # Not enough data, keep default

    correct = sum(1 for r in result.data if r["is_correct"])
    accuracy = correct / len(result.data)
    avg_time = sum(r["time_spent_ms"] for r in result.data) / len(result.data)

    # Get current difficulty from user profile
    user_result = (
        db.table("users")
        .select("topic_levels")
        .eq("id", user_id)
        .single()
        .execute()
    )
    topic_levels = user_result.data.get("topic_levels", {}) if user_result.data else {}
    current = topic_levels.get(topic, 2)

    # FR-21: Adaptation rules
    if accuracy > 0.8 and avg_time < 60000:  # 60 seconds in ms
        new_level = min(5, current + 1)
    elif accuracy < 0.4:
        new_level = max(1, current - 1)
    else:
        new_level = current

    # Update user's topic level
    topic_levels[topic] = new_level
    db.table("users").update({"topic_levels": topic_levels}).eq("id", user_id).execute()

    return new_level


async def get_next_question_id(
    db: Client,
    user_id: int,
    session_exclude: set[str] | None = None,
) -> str | None:
    """Select the next question using adaptive distribution.

    FR-22: 60% weak topics, 30% review, 10% random.

    Args:
        db: Supabase client.
        user_id: Telegram user ID.
        session_exclude: Question IDs already shown this session (from frontend).

    Returns:
        Question UUID or None if no questions available.
    """
    # Build the full exclusion set: DB attempts + current session
    attempted = await _get_attempted_ids(db, user_id)
    exclude = attempted | (session_exclude or set())

    roll = random.random()

    if roll < 0.3:
        # 30% chance: SM-2 review question
        question_id = await _get_review_question(db, user_id, exclude)
        if question_id:
            return question_id

    if roll < 0.9:
        # 60% chance (0.3-0.9): weak topic question
        question_id = await _get_weak_topic_question(db, user_id, exclude)
        if question_id:
            return question_id

    # 10% chance or fallback: random unseen question
    question_id = await _get_random_question(db, user_id, exclude)
    if question_id:
        return question_id

    # Absolute fallback: all questions exhausted. Allow repeats but
    # still exclude the current session to avoid back-to-back repeats.
    return await _get_any_question(db, session_exclude or set())


async def _get_attempted_ids(db: Client, user_id: int) -> set[str]:
    """Get IDs of questions the user has already attempted.

    Used to avoid showing the same question twice until the user
    has gone through the entire pool. SM-2 review is the only path
    that intentionally resurfaces attempted questions.
    """
    result = (
        db.table("question_attempts")
        .select("question_id")
        .eq("user_id", user_id)
        .execute()
    )
    return {r["question_id"] for r in result.data} if result.data else set()


def _pick_unseen(candidates: list[dict], exclude: set[str]) -> str | None:
    """Pick a random question ID not in the exclusion set.

    Returns None if all candidates have been seen — lets the caller
    try a broader search instead of immediately repeating.
    """
    unseen = [q["id"] for q in candidates if q["id"] not in exclude]
    if unseen:
        return random.choice(unseen)
    return None


async def _get_review_question(
    db: Client,
    user_id: int,
    exclude: set[str],
) -> str | None:
    """Get a question due for SM-2 review.

    Excludes questions already shown this session to prevent
    back-to-back repetition within a single practice run.
    """
    result = (
        db.table("user_question_progress")
        .select("question_id")
        .eq("user_id", user_id)
        .lte("next_review", date.today().isoformat())
        .limit(10)
        .execute()
    )
    if result.data:
        candidates = [r for r in result.data if r["question_id"] not in exclude]
        if candidates:
            return random.choice(candidates)["question_id"]
    return None


async def _get_weak_topic_question(
    db: Client,
    user_id: int,
    exclude: set[str],
) -> str | None:
    """Get a question from the user's weakest topic at appropriate difficulty."""
    # Get user's topic levels
    user_result = (
        db.table("users")
        .select("topic_levels")
        .eq("id", user_id)
        .single()
        .execute()
    )
    topic_levels = user_result.data.get("topic_levels", {}) if user_result.data else {}

    # Find weakest topic by accuracy
    weakest_topic = None
    lowest_accuracy = 1.0

    for topic in TOPICS:
        attempts_result = (
            db.table("question_attempts")
            .select("is_correct, questions!inner(topic)")
            .eq("user_id", user_id)
            .eq("questions.topic", topic)
            .execute()
        )
        if attempts_result.data:
            correct = sum(1 for r in attempts_result.data if r["is_correct"])
            accuracy = correct / len(attempts_result.data)
            if accuracy < lowest_accuracy:
                lowest_accuracy = accuracy
                weakest_topic = topic
        else:
            # No attempts = weakest
            weakest_topic = topic
            break

    if not weakest_topic:
        weakest_topic = random.choice(TOPICS)

    target_difficulty = topic_levels.get(weakest_topic, 2)

    # Find a question at that difficulty level — fetch ALL IDs, not limited
    result = (
        db.table("questions")
        .select("id")
        .eq("topic", weakest_topic)
        .eq("difficulty", target_difficulty)
        .execute()
    )

    if result.data:
        pick = _pick_unseen(result.data, exclude)
        if pick:
            return pick

    # Fallback: any difficulty in that topic — fetch ALL IDs
    result = (
        db.table("questions")
        .select("id")
        .eq("topic", weakest_topic)
        .execute()
    )
    if result.data:
        pick = _pick_unseen(result.data, exclude)
        if pick:
            return pick

    # Try other topics before giving up
    other_topics = [t for t in TOPICS if t != weakest_topic]
    random.shuffle(other_topics)
    for topic in other_topics:
        result = (
            db.table("questions")
            .select("id")
            .eq("topic", topic)
            .execute()
        )
        if result.data:
            pick = _pick_unseen(result.data, exclude)
            if pick:
                return pick

    return None


async def _get_random_question(
    db: Client,
    user_id: int,
    exclude: set[str],
) -> str | None:
    """Get a random question the user hasn't seen yet."""
    result = (
        db.table("questions")
        .select("id")
        .execute()
    )
    if result.data:
        return _pick_unseen(result.data, exclude)
    return None


async def _get_any_question(db: Client, session_exclude: set[str]) -> str | None:
    """Absolute fallback: all questions exhausted. Pick any question
    not shown in the current session. Allows DB-level repeats but
    prevents back-to-back repetition within one session.
    """
    result = (
        db.table("questions")
        .select("id")
        .execute()
    )
    if result.data:
        unseen = [q["id"] for q in result.data if q["id"] not in session_exclude]
        if unseen:
            return random.choice(unseen)
        # Even session-exhausted — just pick any question
        return random.choice(result.data)["id"]
    return None
