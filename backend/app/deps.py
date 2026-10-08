"""Shared dependencies.

Auth is out of scope for the assignment, so every request is the default learner
(`DEFAULT_USERNAME`). Swapping this one function for a real session lookup is the
only change a login flow would need.
"""
from __future__ import annotations

from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.gamification import sync_hearts
from app.models import User

DEFAULT_USERNAME = "Ronit"


def current_user(db: Session = Depends(get_db)) -> User:
    user = db.scalar(select(User).where(User.username == DEFAULT_USERNAME))
    if user is None:
        raise HTTPException(503, "Database not seeded. Run: python -m app.seed")
    return sync_hearts(db, user)
