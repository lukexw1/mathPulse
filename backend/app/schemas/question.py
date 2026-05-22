"""Question-related Pydantic schemas."""

from pydantic import BaseModel


class Choice(BaseModel):
    """A single multiple-choice option."""

    label: str  # "A", "B", "C", "D"
    text: str   # The answer text (may contain LaTeX)


class SolutionStep(BaseModel):
    """A single step in the solution explanation."""

    step: int
    text: str      # Explanation text
    formula: str   # LaTeX formula for this step


class QuestionOut(BaseModel):
    """Question sent to the frontend (without correct answer).

    i18n mode: stem/choices/hint are resolved client-side via i18n.
    """

    id: str
    topic: str
    subtopic: str
    difficulty: int
    question_type: str  # "multiple_choice" | "grid_in"
    question_key: str   # Key for i18n lookup ("al1m_10" etc.)


class AnswerRequest(BaseModel):
    """User's answer submission."""

    answer: str
    time_spent_ms: int
    hint_used: bool = False


class AnswerResult(BaseModel):
    """Result after answering a question."""

    is_correct: bool
    correct_answer: str
    question_key: str  # For i18n lookup of solution_steps
    solution_steps: list[SolutionStep]  # Deprecated - use question_key + i18n
    xp_earned: int
    new_total_xp: int
    new_level: int
    achievement_earned: str | None = None


def _build_question_out(q: dict) -> QuestionOut:
    """Build a QuestionOut from a raw DB row (i18n-friendly)."""
    return QuestionOut(
        id=q["id"],
        topic=q["topic"],
        subtopic=q.get("subtopic", ""),
        difficulty=q["difficulty"],
        question_type=q["question_type"],
        question_key=q.get("question_key", ""),
    )
