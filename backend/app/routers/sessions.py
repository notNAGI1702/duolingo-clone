"""The lesson loop: start -> answer (xN) -> complete.

The server owns the session so the client can never award itself XP or skip hearts.
"""
from __future__ import annotations

import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import (
    CROWNS_PER_SKILL,
    MAX_HEARTS,
    PRACTICE_HEART_REWARD,
    XP_PER_PRACTICE,
)
from app.db import get_db
from app.deps import current_user
from app.gamification import (
    gain_hearts,
    lose_heart,
    now,
    record_activity,
    session_xp,
)
from app.grading import grade, solution_text
from app.models import (
    Exercise,
    Lesson,
    LessonSession,
    SessionAnswer,
    User,
    UserSkillProgress,
)
from app.schemas import AnswerIn, AnswerOut, CompleteOut, SessionOut

router = APIRouter(prefix="/api", tags=["lesson"])

GEMS_PER_LESSON = 2


def _exercise_out(ex: Exercise) -> dict:
    return {
        "id": ex.id,
        "position": ex.position,
        "kind": ex.kind,
        "prompt": ex.prompt,
        "payload": ex.payload,
        "audio_text": ex.audio_text,
    }


def _open_session(db: Session, user: User, lesson: Lesson, mode: str) -> dict:
    if mode == "lesson" and user.hearts <= 0:
        raise HTTPException(409, "Out of hearts")

    session = LessonSession(user_id=user.id, lesson_id=lesson.id, mode=mode, started_at=now(db))
    db.add(session)
    db.commit()
    return {
        "session_id": session.id,
        "mode": mode,
        "lesson_id": lesson.id,
        "lesson_title": lesson.title,
        "skill_title": lesson.skill.title,
        "hearts": user.hearts,
        "max_hearts": MAX_HEARTS,
        "exercises": [_exercise_out(ex) for ex in lesson.exercises],
    }


@router.post("/lessons/{lesson_id}/start", response_model=SessionOut)
def start_lesson(
    lesson_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(404, "Lesson not found")
    return _open_session(db, user, lesson, "lesson")


@router.post("/practice/start", response_model=SessionOut)
def start_practice(db: Session = Depends(get_db), user: User = Depends(current_user)):
    """Free review round: costs no hearts and gives one back. Picks from seen lessons."""
    seen = db.scalars(
        select(LessonSession.lesson_id).where(
            LessonSession.user_id == user.id, LessonSession.state == "passed"
        )
    ).all()
    pool = list(dict.fromkeys(seen)) or [db.scalar(select(Lesson.id).order_by(Lesson.id))]
    lesson = db.get(Lesson, random.choice(pool))
    if lesson is None:
        raise HTTPException(404, "Nothing to practise yet")
    return _open_session(db, user, lesson, "practice")


@router.post("/sessions/{session_id}/answer", response_model=AnswerOut)
def answer(
    session_id: int,
    body: AnswerIn,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    session = db.get(LessonSession, session_id)
    if session is None or session.user_id != user.id:
        raise HTTPException(404, "Session not found")
    if session.state != "active":
        raise HTTPException(409, f"Session already {session.state}")

    ex = db.get(Exercise, body.exercise_id)
    if ex is None or ex.lesson_id != session.lesson_id:
        raise HTTPException(400, "Exercise is not part of this lesson")

    correct, note = grade(ex, body.answer)

    # Accuracy counts first attempts only -- a retried exercise does not inflate it.
    first_try = not db.scalar(
        select(SessionAnswer.id).where(
            SessionAnswer.session_id == session.id, SessionAnswer.exercise_id == ex.id
        )
    )
    db.add(
        SessionAnswer(
            session_id=session.id,
            exercise_id=ex.id,
            submitted=body.answer,
            is_correct=correct,
            answered_at=now(db),
        )
    )
    if first_try:
        session.total_count += 1
        if correct:
            session.correct_count += 1

    hearts = user.hearts
    if not correct and session.mode == "lesson":
        session.hearts_lost += 1
        hearts = lose_heart(db, user)
        if hearts == 0:
            session.state = "failed"
            session.finished_at = now(db)
    db.commit()

    return {
        "correct": correct,
        "note": note,
        "solution": solution_text(ex),
        "hearts": hearts,
        "out_of_hearts": hearts == 0 and session.mode == "lesson",
    }


@router.post("/sessions/{session_id}/complete", response_model=CompleteOut)
def complete(
    session_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    session = db.get(LessonSession, session_id)
    if session is None or session.user_id != user.id:
        raise HTTPException(404, "Session not found")
    if session.state == "passed":
        raise HTTPException(409, "Session already completed")
    if session.state != "active":
        raise HTTPException(409, f"Session {session.state}")

    lesson = db.get(Lesson, session.lesson_id)
    base = XP_PER_PRACTICE if session.mode == "practice" else lesson.xp_reward
    xp = session_xp(session, base)

    session.state = "passed"
    session.finished_at = now(db)
    session.xp_earned = xp
    db.commit()

    crown_earned = False
    crowns = 0
    if session.mode == "lesson":
        prog = db.scalar(
            select(UserSkillProgress).where(
                UserSkillProgress.user_id == user.id,
                UserSkillProgress.skill_id == lesson.skill_id,
            )
        )
        if prog is None:
            prog = UserSkillProgress(user_id=user.id, skill_id=lesson.skill_id)
            db.add(prog)
        prog.lessons_done += 1
        if prog.lessons_done >= len(lesson.skill.lessons):
            prog.lessons_done = 0
            if prog.crowns < CROWNS_PER_SKILL:
                prog.crowns += 1
                crown_earned = True
        crowns = prog.crowns
        user.gems += GEMS_PER_LESSON
    else:
        gain_hearts(db, user, PRACTICE_HEART_REWARD)
    db.commit()

    activity = record_activity(db, user, xp)
    duration = int((session.finished_at - session.started_at).total_seconds())
    accuracy = round(100 * session.correct_count / max(1, session.total_count))

    return {
        "state": session.state,
        "xp_earned": xp,
        "total_xp": activity["total_xp"],
        "streak": activity["streak"],
        "streak_extended": activity["streak_extended"],
        "daily_xp": activity["daily_xp"],
        "daily_goal": activity["daily_goal"],
        "daily_goal_reached": activity["daily_goal_reached"],
        "accuracy": accuracy,
        "duration_seconds": duration,
        "hearts": user.hearts,
        "gems": user.gems,
        "crown_earned": crown_earned,
        "crowns": crowns,
        "skill_title": lesson.skill.title,
        "new_achievements": activity["new_achievements"],
    }


@router.post("/sessions/{session_id}/quit")
def quit_session(
    session_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    session = db.get(LessonSession, session_id)
    if session is None or session.user_id != user.id:
        raise HTTPException(404, "Session not found")
    if session.state == "active":
        session.state = "quit"
        session.finished_at = now(db)
        db.commit()
    return {"state": session.state}
