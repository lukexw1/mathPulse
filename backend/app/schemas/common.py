"""Common response wrapper schema."""

from typing import Any

from pydantic import BaseModel


class ApiResponse(BaseModel):
    """Standard API response envelope.

    All API responses follow this format:
    { data: ..., error: ..., message: ... }
    """

    data: Any = None
    error: str | None = None
    message: str | None = None
