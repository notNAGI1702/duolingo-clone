"""Weekly leaderboard, computed from real DailyXP rows (seeded rivals + the learner)."""
from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import current_user
from app.gamification import today, week_xp
from app.models import User
from app.schemas import LeaderboardOut

router = APIRouter(prefix="/api", tags=["social"])


@router.get("/leaderboard", response_model=LeaderboardOut)
def leaderboard(db: Session = Depends(get_db), user: User = Depends(current_user)):
    day = today(db)
    rows = [
        {
            "user_id": u.id,
            "display_name": u.display_name,
            "avatar_emoji": u.avatar_emoji,
            "xp": week_xp(db, u.id, day),
            "is_me": u.id == user.id,
        }
        for u in db.scalars(select(User)).all()
    ]
    rows.sort(key=lambda r: (-r["xp"], r["display_name"]))
    for i, row in enumerate(rows, start=1):
        row["rank"] = i
    return {
        "league": "Bronze League",
        "week_start": day - dt.timedelta(days=day.weekday()),
        "rows": rows,
    }
