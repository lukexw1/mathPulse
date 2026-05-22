"""MathPulse Backend — FastAPI application."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import auth, dashboard, onboarding, questions, review, profile, theory


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup and shutdown events."""
    # Startup
    yield
    # Shutdown


app = FastAPI(
    title="MathPulse API",
    description="SAT Math preparation Telegram Mini App backend",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])
app.include_router(onboarding.router, prefix="/api/onboarding", tags=["onboarding"])
app.include_router(questions.router, prefix="/api/questions", tags=["questions"])
app.include_router(review.router, prefix="/api/review", tags=["review"])
app.include_router(profile.router, prefix="/api", tags=["profile"])
app.include_router(theory.router, prefix="/api", tags=["theory"])


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint for UptimeRobot."""
    return {"status": "ok"}
