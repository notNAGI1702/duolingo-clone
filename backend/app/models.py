"""Database schema.

Content side (seeded, read-only at runtime):
    Course -> Unit -> Skill -> Lesson -> Exercise
Learner side (mutated by the lesson loop):
    User, UserSkillProgress, LessonSession, SessionAnswer, DailyXP, UserAchievement
AppState holds the single simulated-clock row so streak logic is testable.
"""
from __future__ import annotations

import datetime as dt

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.config import DEFAULT_DAILY_GOAL, MAX_HEARTS
from app.db import Base


def utcnow() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)


# --------------------------------------------------------------------- content


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(80))
    language_code: Mapped[str] = mapped_column(String(8))
    from_language: Mapped[str] = mapped_column(String(40))
    flag_emoji: Mapped[str] = mapped_column(String(8))

    units: Mapped[list[Unit]] = relationship(
        back_populates="course", order_by="Unit.position", cascade="all, delete-orphan"
    )


class Unit(Base):
    __tablename__ = "units"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(String(200))
    color: Mapped[str] = mapped_column(String(16))  # unit banner colour (hex)

    course: Mapped[Course] = relationship(back_populates="units")
    skills: Mapped[list[Skill]] = relationship(
        back_populates="unit", order_by="Skill.position", cascade="all, delete-orphan"
    )


class Skill(Base):
    """One bubble on the learning path."""

    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(primary_key=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(80))
    icon: Mapped[str] = mapped_column(String(32))  # icon key, see frontend PathIcon
    kind: Mapped[str] = mapped_column(String(16), default="lesson")  # lesson|chest|trophy

    unit: Mapped[Unit] = relationship(back_populates="skills")
    lessons: Mapped[list[Lesson]] = relationship(
        back_populates="skill", order_by="Lesson.position", cascade="all, delete-orphan"
    )


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(primary_key=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(80))
    xp_reward: Mapped[int] = mapped_column(Integer, default=10)

    skill: Mapped[Skill] = relationship(back_populates="lessons")
    exercises: Mapped[list[Exercise]] = relationship(
        back_populates="lesson", order_by="Exercise.position", cascade="all, delete-orphan"
    )


class Exercise(Base):
    """`kind` decides which React component renders it.

    kind             payload                                   answer
    multiple_choice  {options: [{id, text, emoji}]}            {option_id}
    translate        {source, bank: [str]}                     {words: [str], alternates: [[str]]}
    match_pairs      {pairs: [{a, b}]}                         {} (all pairs must match)
    fill_blank       {before, after, options: [str]}           {text}
    type_answer      {source}                                  {text, alternates: [str]}

    `answer` is stripped before the payload is sent to the client -- grading is server side.
    """

    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    kind: Mapped[str] = mapped_column(String(24))
    prompt: Mapped[str] = mapped_column(String(160))
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    answer: Mapped[dict] = mapped_column(JSON, default=dict)
    audio_text: Mapped[str | None] = mapped_column(String(160), nullable=True)

    lesson: Mapped[Lesson] = relationship(back_populates="exercises")


# --------------------------------------------------------------------- learner


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(40), unique=True)
    display_name: Mapped[str] = mapped_column(String(60))
    avatar_emoji: Mapped[str] = mapped_column(String(8), default="O")
    course_id: Mapped[int | None] = mapped_column(ForeignKey("courses.id"), nullable=True)

    total_xp: Mapped[int] = mapped_column(Integer, default=0)
    gems: Mapped[int] = mapped_column(Integer, default=500)
    hearts: Mapped[int] = mapped_column(Integer, default=MAX_HEARTS)
    hearts_updated_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)
    streak: Mapped[int] = mapped_column(Integer, default=0)
    streak_last_day: Mapped[dt.date | None] = mapped_column(Date, nullable=True)
    daily_goal: Mapped[int] = mapped_column(Integer, default=DEFAULT_DAILY_GOAL)
    is_seed_rival: Mapped[bool] = mapped_column(Boolean, default=False)  # leaderboard filler
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)

    skill_progress: Mapped[list[UserSkillProgress]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class UserSkillProgress(Base):
    """Crown level + how far into the current crown the learner is."""

    __tablename__ = "user_skill_progress"
    __table_args__ = (UniqueConstraint("user_id", "skill_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"), index=True)
    crowns: Mapped[int] = mapped_column(Integer, default=0)
    lessons_done: Mapped[int] = mapped_column(Integer, default=0)  # within current crown

    user: Mapped[User] = relationship(back_populates="skill_progress")
    skill: Mapped[Skill] = relationship()


class LessonSession(Base):
    """One run through a lesson. Grading state lives here, not in the client."""

    __tablename__ = "lesson_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), index=True)
    mode: Mapped[str] = mapped_column(String(12), default="lesson")  # lesson|practice
    state: Mapped[str] = mapped_column(String(12), default="active")  # active|passed|failed|quit
    hearts_lost: Mapped[int] = mapped_column(Integer, default=0)
    correct_count: Mapped[int] = mapped_column(Integer, default=0)
    total_count: Mapped[int] = mapped_column(Integer, default=0)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)
    finished_at: Mapped[dt.datetime | None] = mapped_column(DateTime, nullable=True)

    lesson: Mapped[Lesson] = relationship()
    answers: Mapped[list[SessionAnswer]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class SessionAnswer(Base):
    __tablename__ = "session_answers"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("lesson_sessions.id"), index=True)
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"))
    submitted: Mapped[dict] = mapped_column(JSON, default=dict)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)
    answered_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)

    session: Mapped[LessonSession] = relationship(back_populates="answers")


class DailyXP(Base):
    """XP per calendar day -- powers the daily goal ring and the weekly leaderboard."""

    __tablename__ = "daily_xp"
    __table_args__ = (UniqueConstraint("user_id", "day"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    day: Mapped[dt.date] = mapped_column(Date, index=True)
    xp: Mapped[int] = mapped_column(Integer, default=0)
    lessons: Mapped[int] = mapped_column(Integer, default=0)


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True)
    title: Mapped[str] = mapped_column(String(40))
    description: Mapped[str] = mapped_column(String(120))
    icon: Mapped[str] = mapped_column(String(24))
    metric: Mapped[str] = mapped_column(String(24))  # streak|total_xp|crowns|perfect_lessons|words
    tiers: Mapped[list] = mapped_column(JSON, default=list)  # ascending thresholds


class UserAchievement(Base):
    """Only rows for tiers actually unlocked; live progress is computed on read."""

    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_id", "tier"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    achievement_id: Mapped[int] = mapped_column(ForeignKey("achievements.id"))
    tier: Mapped[int] = mapped_column(Integer)
    unlocked_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)


class AppState(Base):
    """Single row. `day_offset` lets the UI jump the clock to test streaks."""

    __tablename__ = "app_state"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    day_offset: Mapped[int] = mapped_column(Integer, default=0)
