"""User-related Pydantic schemas."""

from pydantic import BaseModel


class TelegramUser(BaseModel):
    """User extracted from Telegram initData."""

    id: int
    first_name: str
    username: str | None = None
    language_code: str | None = None


class AuthRequest(BaseModel):
    """Request body for Telegram auth."""

    init_data: str


class UserProfile(BaseModel):
    """Full user profile response."""

    id: int
    username: str | None = None
    first_name: str
    goal: str | None = None
    xp: int = 0
    level: int = 1
    streak_days: int = 0
    is_new: bool = False
