"""Theory-related Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel, Field


class TheoryArticle(BaseModel):
    """Theory article metadata and content."""

    subtopic: str
    title: str
    content_md: str
    estimated_minutes: int
    quiz_questions: list[str]  # List of question IDs for the quiz


class TheoryProgress(BaseModel):
    """User's progress on a specific theory subtopic."""

    subtopic: str
    completed: bool
    quiz_score: int | None = None
    quiz_attempts: int = 0
    best_score: int | None = None
    completed_at: datetime | None = None
    last_attempt_at: datetime | None = None


class TheoryListResponse(BaseModel):
    """Response for GET /theory - list of all theory articles with progress."""

    articles: list[dict]  # [{subtopic, title, completed, best_score, estimated_minutes}, ...]


class TheoryArticleResponse(BaseModel):
    """Response for GET /theory/{subtopic} - full article with content."""

    subtopic: str
    title: str
    content_md: str
    estimated_minutes: int
    quiz_questions: list[str]
    progress: TheoryProgress | None = None


class QuizSubmitRequest(BaseModel):
    """Request body for POST /theory/{subtopic}/quiz."""

    answers: dict[str, int] = Field(
        ...,
        description="Map of question_id -> selected_option_index (0-3)",
        example={"q1": 2, "q2": 0, "q3": 1, "q4": 3, "q5": 1},
    )


class QuizResult(BaseModel):
    """Individual quiz question result."""

    question_id: str
    correct: bool
    selected_index: int
    correct_index: int


class QuizSubmitResponse(BaseModel):
    """Response for POST /theory/{subtopic}/quiz."""

    score: int  # 0-5 (number of correct answers)
    total: int = 5
    percentage: int  # 0-100
    passed: bool  # True if >= 60%
    results: list[QuizResult]
    xp_earned: int
    new_badges: list["BadgeUnlock"] = []


class Badge(BaseModel):
    """Theory badge metadata."""

    id: str
    code: str
    title: str
    description: str
    icon: str | None = None
    xp_reward: int


class BadgeUnlock(BaseModel):
    """Badge unlock notification."""

    badge: Badge
    earned_at: datetime


class UserTheoryStats(BaseModel):
    """User's overall theory statistics."""

    total_lessons: int
    completed_lessons: int
    total_badges: int
    earned_badges: int
    badges: list[BadgeUnlock] = []
