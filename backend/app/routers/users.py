"""Learner profile, hearts shop, daily quests and the simulated-clock dev tools."""
from __future__ import annotations

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import HEART_REFILL_GEM_COST, MAX_HEARTS
from app.db import get_db
from app.deps import current_user
from app.gamification import (
    achievement_list,
    app_state,
    gain_hearts,
    today,
)
from app.models import (
    DailyXP,
    LessonSession,
    SessionAnswer,
    User,
    UserAchievement,
    UserSkillProgress,
)
from app.schemas import GoalIn, ProfileOut, QuestOut, RefillIn, UserOut
from app.serializers import lessons_completed, user_out

router = APIRouter(prefix="/api", tags=["learner"])


@router.get("/me", response_model=UserOut)
def me(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return user_out(db, user)


@router.patch("/me/goal", response_model=UserOut)
def set_goal(body: GoalIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if body.daily_goal not in (10, 20, 30, 50):
        raise HTTPException(400, "Daily goal must be 10, 20, 30 or 50 XP")
    user.daily_goal = body.daily_goal
    db.commit()
    return user_out(db, user)


@router.get("/profile", response_model=ProfileOut)
def profile(db: Session = Depends(get_db), user: User = Depends(current_user)):
    crowns = db.scalar(
        select(func.coalesce(func.sum(UserSkillProgress.crowns), 0)).where(
            UserSkillProgress.user_id == user.id
        )
    )
    words = db.scalar(
        select(func.count(func.distinct(SessionAnswer.exercise_id)))
        .join(LessonSession, LessonSession.id == SessionAnswer.session_id)
        .where(LessonSession.user_id == user.id, SessionAnswer.is_correct.is_(True))
    )
    perfect = db.scalar(
        select(func.count())
        .select_from(LessonSession)
        .where(
            LessonSession.user_id == user.id,
            LessonSession.state == "passed",
            LessonSession.hearts_lost == 0,
        )
    )
    return {
        "user": user_out(db, user),
        "joined": user.created_at.date(),
        "lessons_completed": lessons_completed(db, user),
        "crowns": crowns,
        "words_learned": words,
        "perfect_lessons": perfect,
        "achievements": achievement_list(db, user),
        # social features are explicitly mocked in the brief
        "following": 4,
        "followers": 7,
    }


@router.get("/quests", response_model=list[QuestOut])
def quests(db: Session = Depends(get_db), user: User = Depends(current_user)):
    day = today(db)
    row = db.scalar(select(DailyXP).where(DailyXP.user_id == user.id, DailyXP.day == day))
    lessons_today = row.lessons if row else 0
    xp_today = row.xp if row else 0
    flawless = db.scalar(
        select(func.count())
        .select_from(LessonSession)
        .where(
            LessonSession.user_id == user.id,
            LessonSession.state == "passed",
            LessonSession.hearts_lost == 0,
            func.date(LessonSession.finished_at) == day.isoformat(),
        )
    )
    specs = [
        ("earn_xp", f"Earn {user.daily_goal} XP", "bolt", xp_today, user.daily_goal, 10),
        ("lessons", "Complete 2 lessons", "book", lessons_today, 2, 15),
        ("flawless", "Finish a lesson with no mistakes", "heart", flawless, 1, 20),
    ]
    return [
        {
            "code": code,
            "title": title,
            "icon": icon,
            "value": min(value, target),
            "target": target,
            "reward_gems": gems,
            "done": value >= target,
        }
        for code, title, icon, value, target, gems in specs
    ]


@router.post("/hearts/refill", response_model=UserOut)
def refill_hearts(
    body: RefillIn = Body(default=RefillIn()),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    """Mocked shop purchase: gems are fake money, the hearts are real."""
    if user.hearts >= MAX_HEARTS:
        raise HTTPException(409, "Hearts are already full")
    if user.gems < HEART_REFILL_GEM_COST:
        raise HTTPException(402, "Not enough gems")
    user.gems -= HEART_REFILL_GEM_COST
    gain_hearts(db, user, MAX_HEARTS)
    return user_out(db, user)


# ------------------------------------------------------- dev / demo utilities


@router.post("/dev/advance-day", response_model=UserOut)
def advance_day(
    days: int = Body(1, embed=True),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    """Shift the app clock so streaks and heart regen can be demoed in seconds."""
    state = app_state(db)
    state.day_offset += days
    db.commit()
    return user_out(db, user)


@router.post("/dev/reset-progress", response_model=UserOut)
def reset_progress(db: Session = Depends(get_db), user: User = Depends(current_user)):
    for model in (UserSkillProgress, DailyXP, UserAchievement):
        for row in db.scalars(select(model).where(model.user_id == user.id)).all():
            db.delete(row)
    for s in db.scalars(select(LessonSession).where(LessonSession.user_id == user.id)).all():
        db.delete(s)
    user.total_xp = 0
    user.streak = 0
    user.streak_last_day = None
    user.hearts = MAX_HEARTS
    app_state(db).day_offset = 0
    db.commit()
    return user_out(db, user)
