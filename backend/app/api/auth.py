"""Authentication endpoints — Telegram initData validation."""

import logging
import traceback

from fastapi import APIRouter, HTTPException

from app.core.supabase import get_supabase
from app.core.telegram_auth import validate_init_data
from app.schemas.common import ApiResponse
from app.schemas.user import AuthRequest, UserProfile

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/telegram", response_model=ApiResponse)
async def authenticate(body: AuthRequest) -> ApiResponse:
    """Validate Telegram initData, create or update user.

    FR-6, FR-7, FR-8, FR-9: TMA auth only, HMAC validation,
    extract user data, no passwords/emails.
    """
    user = validate_init_data(body.init_data)
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Откройте приложение через Telegram",
        )

    try:
        db = get_supabase()

        # Check if user exists
        result = db.table("users").select("*").eq("id", user.id).execute()

        is_new = len(result.data) == 0

        if is_new:
            # Create new user
            db.table("users").insert({
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "language_code": user.language_code or "ru",
                "xp": 0,
                "level": 1,
                "streak_days": 0,
            }).execute()
        else:
            # Update existing user info
            db.table("users").update({
                "username": user.username,
                "first_name": user.first_name,
                "language_code": user.language_code or "ru",
            }).eq("id", user.id).execute()

        # Fetch full profile
        result = db.table("users").select("*").eq("id", user.id).single().execute()
        row = result.data

        profile = UserProfile(
            id=row["id"],
            username=row.get("username"),
            first_name=row["first_name"],
            goal=row.get("goal"),
            xp=row.get("xp", 0),
            level=row.get("level", 1),
            streak_days=row.get("streak_days", 0),
            is_new=is_new,
        )

        return ApiResponse(data=profile.model_dump(), message="Авторизация успешна")

    except Exception as e:
        logger.error("Auth error for user %s: %s\n%s", user.id, e, traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Server error: {type(e).__name__}: {e}",
        )
