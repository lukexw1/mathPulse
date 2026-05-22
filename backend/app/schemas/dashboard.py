"""Dashboard-related Pydantic schemas."""

from pydantic import BaseModel


class TopicProgress(BaseModel):
    """Progress for a single topic."""

    topic: str
    solved: int          # unique questions answered correctly
    total_questions: int  # total questions available in this topic
    accuracy: float       # 0.0 to 1.0 (solved / total_questions)


class NextTheoryTopic(BaseModel):
    """Next unlearned theory topic."""

    subtopic: str
    title: str
    estimated_minutes: int


class DashboardResponse(BaseModel):
    """All data needed for the home screen."""

    xp: int
    level: int
    xp_to_next_level: int  # XP needed to reach next level
    streak_days: int
    streak_record: int
    review_due_count: int
    topics: list[TopicProgress]
    total_solved: int
    next_unlearned_topic: NextTheoryTopic | None  # Next theory topic to learn
