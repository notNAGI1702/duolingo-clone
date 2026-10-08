"""Model -> response-dict helpers shared by the routers."""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import CROWNS_PER_SKILL, MAX_HEARTS
from app.gamification import daily_xp, seconds_to_next_heart, today
from app.models import (
    Course,
    Exercise,
    LessonSession,
    Skill,
    Unit,
    User,
    UserSkillProgress,
)


def course_out(course: Course | None) -> dict | None:
    if course is None:
        return None
    return {
        "id": course.id,
        "title": course.title,
        "language_code": course.language_code,
        "from_language": course.from_language,
        "flag_emoji": course.flag_emoji,
    }


def user_out(db: Session, user: User) -> dict:
    day = today(db)
    return {
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name,
        "avatar_emoji": user.avatar_emoji,
        "total_xp": user.total_xp,
        "gems": user.gems,
        "hearts": user.hearts,
        "max_hearts": MAX_HEARTS,
        "seconds_to_next_heart": seconds_to_next_heart(db, user),
        "streak": user.streak,
        "streak_last_day": user.streak_last_day,
        "streak_active_today": user.streak_last_day == day,
        "daily_goal": user.daily_goal,
        "daily_xp": daily_xp(db, user),
        "today": day,
        "course": course_out(db.get(Course, user.course_id) if user.course_id else None),
    }


def progress_map(db: Session, user: User) -> dict[int, UserSkillProgress]:
    rows = db.scalars(
        select(UserSkillProgress).where(UserSkillProgress.user_id == user.id)
    ).all()
    return {r.skill_id: r for r in rows}


def _exercise_counts(db: Session, skill: Skill) -> dict[int, int]:
    rows = db.execute(
        select(Exercise.lesson_id, func.count())
        .where(Exercise.lesson_id.in_([lesson.id for lesson in skill.lessons] or [0]))
        .group_by(Exercise.lesson_id)
    ).all()
    return dict(rows)


def skill_out(db: Session, skill: Skill, prog: UserSkillProgress | None, unlocked: bool) -> dict:
    crowns = prog.crowns if prog else 0
    done = prog.lessons_done if prog else 0
    total = len(skill.lessons)
    counts = _exercise_counts(db, skill)

    if not unlocked:
        status = "locked"
    elif crowns >= CROWNS_PER_SKILL:
        status = "legendary"
    elif crowns >= 1:
        status = "complete"
    elif done > 0:
        status = "active"
    else:
        status = "available"

    next_lesson = skill.lessons[done] if done < total else (skill.lessons[0] if total else None)
    return {
        "id": skill.id,
        "position": skill.position,
        "title": skill.title,
        "icon": skill.icon,
        "kind": skill.kind,
        "crowns": crowns,
        "max_crowns": CROWNS_PER_SKILL,
        "lessons_done": done,
        "total_lessons": total,
        "status": status,
        "next_lesson_id": next_lesson.id if next_lesson else None,
        "lessons": [
            {
                "id": lesson.id,
                "position": lesson.position,
                "title": lesson.title,
                "xp_reward": lesson.xp_reward,
                "exercise_count": counts.get(lesson.id, 0),
                "completed": i < done or crowns >= 1,
            }
            for i, lesson in enumerate(skill.lessons)
        ],
    }


def path_out(db: Session, user: User, course: Course) -> dict:
    progress = progress_map(db, user)
    units: list[dict] = []
    prev_done = True  # first skill of the course is always open
    active_skill_id: int | None = None

    for unit in db.scalars(
        select(Unit).where(Unit.course_id == course.id).order_by(Unit.position)
    ).all():
        unit_unlocked = prev_done
        skills = []
        for skill in unit.skills:
            unlocked = prev_done
            data = skill_out(db, skill, progress.get(skill.id), unlocked)
            if active_skill_id is None and unlocked and data["crowns"] == 0:
                active_skill_id = skill.id
            prev_done = unlocked and data["crowns"] >= 1
            skills.append(data)
        units.append(
            {
                "id": unit.id,
                "position": unit.position,
                "title": unit.title,
                "description": unit.description,
                "color": unit.color,
                "unlocked": unit_unlocked,
                "skills": skills,
            }
        )
    return {"course": course_out(course), "units": units, "active_skill_id": active_skill_id}


def lessons_completed(db: Session, user: User) -> int:
    return db.scalar(
        select(func.count())
        .select_from(LessonSession)
        .where(LessonSession.user_id == user.id, LessonSession.state == "passed")
    )
