"""Telegram initData validation (HMAC-SHA256)."""

import hashlib
import hmac
import json
import time
from urllib.parse import parse_qs, unquote

from app.core.config import settings
from app.schemas.user import TelegramUser


def validate_init_data(init_data: str) -> TelegramUser | None:
    """Validate Telegram WebApp initData and extract user.

    Follows official Telegram docs:
    https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

    Args:
        init_data: Raw initData string from Telegram WebApp.

    Returns:
        TelegramUser if valid, None if validation fails.
    """
    if not init_data or not settings.bot_token:
        return None

    try:
        parsed = parse_qs(init_data, keep_blank_values=True)

        # Extract hash
        received_hash = parsed.get("hash", [None])[0]
        if not received_hash:
            return None

        # Check auth_date is not too old (allow 1 hour)
        auth_date_str = parsed.get("auth_date", [None])[0]
        if not auth_date_str:
            return None
        auth_date = int(auth_date_str)
        if time.time() - auth_date > 3600:
            return None

        # Build data-check-string
        # Sort all key=value pairs alphabetically, excluding 'hash'
        pairs = []
        for key, values in parsed.items():
            if key == "hash":
                continue
            pairs.append(f"{key}={values[0]}")
        pairs.sort()
        data_check_string = "\n".join(pairs)

        # Compute HMAC
        secret_key = hmac.new(
            b"WebAppData",
            settings.bot_token.encode("utf-8"),
            hashlib.sha256,
        ).digest()

        computed_hash = hmac.new(
            secret_key,
            data_check_string.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(computed_hash, received_hash):
            return None

        # Parse user JSON
        user_json_str = parsed.get("user", [None])[0]
        if not user_json_str:
            return None

        user_data = json.loads(unquote(user_json_str))
        return TelegramUser(
            id=user_data["id"],
            first_name=user_data.get("first_name", ""),
            username=user_data.get("username"),
            language_code=user_data.get("language_code"),
        )
    except (KeyError, ValueError, json.JSONDecodeError):
        return None
