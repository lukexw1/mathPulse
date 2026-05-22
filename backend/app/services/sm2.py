"""SM-2 Spaced Repetition Algorithm.

Standard SM-2 implementation:
- quality 0-5 scale (0=complete failure, 5=perfect)
- If quality < 3: reset interval to 1
- Easiness factor: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
- Minimum EF = 1.3
"""

from datetime import date, timedelta

from supabase import Client


def recalculate_sm2(
    db: Client,
    user_id: int,
    question_id: str,
    quality: int,
) -> None:
    """Recalculate SM-2 parameters after a review.

    FR-24, FR-26: Update easiness factor, interval, repetitions.
    If quality < 3, reset interval to 1 day.

    Args:
        db: Supabase client.
        user_id: Telegram user ID.
        question_id: UUID of the question.
        quality: User's self-assessment (0-5).
    """
    # Get current progress
    result = (
        db.table("user_question_progress")
        .select("*")
        .eq("user_id", user_id)
        .eq("question_id", question_id)
        .maybe_single()
        .execute()
    )

    if not result.data:
        # First time — create entry
        ef = 2.5
        interval = 1
        repetitions = 0
    else:
        ef = result.data["easiness_factor"]
        interval = result.data["interval_days"]
        repetitions = result.data["repetitions"]

    # SM-2 algorithm
    if quality < 3:
        # FR-26: Reset interval if quality < 3
        repetitions = 0
        interval = 1
    else:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = round(interval * ef)
        repetitions += 1

    # Update easiness factor
    ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    ef = max(1.3, ef)

    next_review = date.today() + timedelta(days=interval)

    # Upsert progress
    data = {
        "user_id": user_id,
        "question_id": question_id,
        "easiness_factor": round(ef, 2),
        "interval_days": interval,
        "repetitions": repetitions,
        "next_review": next_review.isoformat(),
    }

    if result.data:
        db.table("user_question_progress").update(data).eq(
            "user_id", user_id
        ).eq("question_id", question_id).execute()
    else:
        data["attempts"] = 1
        data["correct_count"] = 1 if quality >= 3 else 0
        db.table("user_question_progress").insert(data).execute()


def update_sm2_on_answer(
    db: Client,
    user_id: int,
    question_id: str,
    quality: int,
) -> None:
    """Update SM-2 after answering a question (not explicit review).

    FR-23: Add incorrect answers to review queue.

    Args:
        db: Supabase client.
        user_id: Telegram user ID.
        question_id: UUID of the question.
        quality: Derived quality (5=correct+no hint, 3=correct+hint, 1=incorrect).
    """
    recalculate_sm2(db, user_id, question_id, quality)
