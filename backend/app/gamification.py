"""Hearts, streak, XP and achievement rules.

Everything time-sensitive goes through `today()`/`now()` here, so `AppState.day_offset`
can fast-forward the clock and the streak logic stays testable without waiting a day.
"""
from __future__ import annotations

import datetime as dt

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import (
    HEART_REGEN_MINUTES,
    MAX_HEARTS,
    XP_PERFECT_BONUS,
)
from app.models import (
    Achievement,
    AppState,
    DailyXP,
    LessonSession,
    SessionAnswer,
    User,
    UserAchievement,
    UserSkillProgress,
    utcnow,
)

# ------------------------------------------------------------------ clock


def app_state(db: Session) -> AppState:
    state = db.get(AppState, 1)
    if state is None:
        state = AppState(id=1, day_offset=0)
        db.add(state)
        db.commit()
    return state


def offset(db: Session) -> dt.timedelta:
    return dt.timedelta(days=app_state(db).day_offset)


def now(db: Session) -> dt.datetime:
    return utcnow() + offset(db)


def today(db: Session) -> dt.date:
    return now(db).date()


# ------------------------------------------------------------------ hearts


def sync_hearts(db: Session, user: User) -> User:
    """Lazily regenerate hearts: one per HEART_REGEN_MINUTES, capped at MAX_HEARTS."""
    if user.hearts >= MAX_HEARTS:
        user.hearts_updated_at = now(db)
        return user
    elapsed = (now(db) - user.hearts_updated_at).total_seconds() / 60
    gained = int(elapsed // HEART_REGEN_MINUTES)
    if gained:
        user.hearts = min(MAX_HEARTS, user.hearts + gained)
        user.hearts_updated_at = user.hearts_updated_at + dt.timedelta(
            minutes=gained * HEART_REGEN_MINUTES
        )
        db.commit()
    return user


def seconds_to_next_heart(db: Session, user: User) -> int | None:
    if user.hearts >= MAX_HEARTS:
        return None
    due = user.hearts_updated_at + dt.timedelta(minutes=HEART_REGEN_MINUTES)
    return max(0, int((due - now(db)).total_seconds()))


def lose_heart(db: Session, user: User) -> int:
    if user.hearts == MAX_HEARTS:
        user.hearts_updated_at = now(db)  # timer only starts once you drop below full
    user.hearts = max(0, user.hearts - 1)
    db.commit()
    return user.hearts


def gain_hearts(db: Session, user: User, amount: int) -> int:
    user.hearts = min(MAX_HEARTS, user.hearts + amount)
    user.hearts_updated_at = now(db)
    db.commit()
    return user.hearts


# ------------------------------------------------------------------ xp / streak


def record_activity(db: Session, user: User, xp: int) -> dict:
    """Credit XP, roll the streak forward, and return what the UI needs to celebrate."""
    day = today(db)
    row = db.scalar(select(DailyXP).where(DailyXP.user_id == user.id, DailyXP.day == day))
    if row is None:
        row = DailyXP(user_id=user.id, day=day, xp=0, lessons=0)
        db.add(row)
    goal_before = row.xp >= user.daily_goal
    row.xp += xp
    row.lessons += 1
    user.total_xp += xp

    streak_before = user.streak
    last = user.streak_last_day
    if last == day:
        pass  # already counted today
    elif last == day - dt.timedelta(days=1):
        user.streak += 1
    else:
        user.streak = 1
    user.streak_last_day = day

    db.commit()
    unlocked = refresh_achievements(db, user)
    return {
        "xp_earned": xp,
        "total_xp": user.total_xp,
        "streak": user.streak,
        "streak_extended": user.streak != streak_before,
        "daily_goal": user.daily_goal,
        "daily_xp": row.xp,
        "daily_goal_reached": not goal_before and row.xp >= user.daily_goal,
        "new_achievements": unlocked,
    }


def daily_xp(db: Session, user: User) -> int:
    row = db.scalar(select(DailyXP).where(DailyXP.user_id == user.id, DailyXP.day == today(db)))
    return row.xp if row else 0


def week_xp(db: Session, user_id: int, day: dt.date) -> int:
    monday = day - dt.timedelta(days=day.weekday())
    rows = db.scalars(
        select(DailyXP).where(DailyXP.user_id == user_id, DailyXP.day >= monday)
    ).all()
    return sum(r.xp for r in rows)


def session_xp(session: LessonSession, base_xp: int) -> int:
    perfect = session.hearts_lost == 0 and session.mode == "lesson"
    return base_xp + (XP_PERFECT_BONUS if perfect else 0)


# ------------------------------------------------------------------ achievements


def _metrics(db: Session, user: User) -> dict[str, int]:
    crowns = db.scalar(
        select(func.coalesce(func.sum(UserSkillProgress.crowns), 0)).where(
            UserSkillProgress.user_id == user.id
        )
    )
    perfect_count = db.scalar(
        select(func.count())
        .select_from(LessonSession)
        .where(
            LessonSession.user_id == user.id,
            LessonSession.state == "passed",
            LessonSession.hearts_lost == 0,
        )
    )
    # "words learned" ~= distinct exercises ever answered correctly
    words = db.scalar(
        select(func.count(func.distinct(SessionAnswer.exercise_id)))
        .join(LessonSession, LessonSession.id == SessionAnswer.session_id)
        .where(LessonSession.user_id == user.id, SessionAnswer.is_correct.is_(True))
    )
    return {
        "streak": user.streak,
        "total_xp": user.total_xp,
        "crowns": crowns,
        "perfect_lessons": perfect_count,
        "words": words,
    }


def refresh_achievements(db: Session, user: User) -> list[dict]:
    """Unlock any tier whose threshold the learner has now passed."""
    metrics = _metrics(db, user)
    owned = {
        (ua.achievement_id, ua.tier)
        for ua in db.scalars(
            select(UserAchievement).where(UserAchievement.user_id == user.id)
        ).all()
    }
    unlocked: list[dict] = []
    for ach in db.scalars(select(Achievement)).all():
        value = metrics.get(ach.metric, 0)
        for i, threshold in enumerate(ach.tiers):
            if value >= threshold and (ach.id, i + 1) not in owned:
                db.add(UserAchievement(user_id=user.id, achievement_id=ach.id, tier=i + 1))
                unlocked.append(
                    {"code": ach.code, "title": ach.title, "tier": i + 1, "icon": ach.icon}
                )
    if unlocked:
        db.commit()
    return unlocked


def achievement_list(db: Session, user: User) -> list[dict]:
    metrics = _metrics(db, user)
    out = []
    for ach in db.scalars(select(Achievement).order_by(Achievement.id)).all():
        value = metrics.get(ach.metric, 0)
        tier = sum(1 for t in ach.tiers if value >= t)
        nxt = ach.tiers[tier] if tier < len(ach.tiers) else ach.tiers[-1]
        floor = ach.tiers[tier - 1] if tier else 0
        out.append(
            {
                "code": ach.code,
                "title": ach.title,
                "description": ach.description,
                "icon": ach.icon,
                "tier": tier,
                "max_tier": len(ach.tiers),
                "value": value,
                "next_threshold": nxt,
                "progress": 1.0
                if tier >= len(ach.tiers)
                else max(0.0, min(1.0, (value - floor) / max(1, nxt - floor))),
            }
        )
    return out
