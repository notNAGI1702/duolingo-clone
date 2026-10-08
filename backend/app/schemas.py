"""Response/request shapes. These drive the OpenAPI docs at /docs."""
from __future__ import annotations

import datetime as dt
from typing import Any, Literal

from pydantic import BaseModel

SkillStatus = Literal["locked", "available", "active", "complete", "legendary"]


class UserOut(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_emoji: str
    total_xp: int
    gems: int
    hearts: int
    max_hearts: int
    seconds_to_next_heart: int | None
    streak: int
    streak_last_day: dt.date | None
    streak_active_today: bool
    daily_goal: int
    daily_xp: int
    today: dt.date
    course: CourseOut | None = None


class CourseOut(BaseModel):
    id: int
    title: str
    language_code: str
    from_language: str
    flag_emoji: str


class LessonOut(BaseModel):
    id: int
    position: int
    title: str
    xp_reward: int
    exercise_count: int
    completed: bool


class SkillOut(BaseModel):
    id: int
    position: int
    title: str
    icon: str
    kind: str
    crowns: int
    max_crowns: int
    lessons_done: int
    total_lessons: int
    status: SkillStatus
    lessons: list[LessonOut]
    next_lesson_id: int | None


class UnitOut(BaseModel):
    id: int
    position: int
    title: str
    description: str
    color: str
    unlocked: bool
    skills: list[SkillOut]


class PathOut(BaseModel):
    course: CourseOut
    units: list[UnitOut]
    active_skill_id: int | None


class ExerciseOut(BaseModel):
    """`answer` is deliberately absent."""

    id: int
    position: int
    kind: str
    prompt: str
    payload: dict[str, Any]
    audio_text: str | None


class SessionOut(BaseModel):
    session_id: int
    mode: str
    lesson_id: int
    lesson_title: str
    skill_title: str
    hearts: int
    max_hearts: int
    exercises: list[ExerciseOut]


class AnswerIn(BaseModel):
    exercise_id: int
    answer: dict[str, Any]


class AnswerOut(BaseModel):
    correct: bool
    note: str | None
    solution: str
    hearts: int
    out_of_hearts: bool


class AchievementOut(BaseModel):
    code: str
    title: str
    description: str
    icon: str
    tier: int
    max_tier: int
    value: int
    next_threshold: int
    progress: float


class CompleteOut(BaseModel):
    state: str
    xp_earned: int
    total_xp: int
    streak: int
    streak_extended: bool
    daily_xp: int
    daily_goal: int
    daily_goal_reached: bool
    accuracy: int
    duration_seconds: int
    hearts: int
    gems: int
    crown_earned: bool
    crowns: int
    skill_title: str
    new_achievements: list[dict[str, Any]]


class LeaderboardRow(BaseModel):
    rank: int
    user_id: int
    display_name: str
    avatar_emoji: str
    xp: int
    is_me: bool


class LeaderboardOut(BaseModel):
    league: str
    week_start: dt.date
    rows: list[LeaderboardRow]


class ProfileOut(BaseModel):
    user: UserOut
    joined: dt.date
    lessons_completed: int
    crowns: int
    words_learned: int
    perfect_lessons: int
    achievements: list[AchievementOut]
    following: int
    followers: int


class QuestOut(BaseModel):
    code: str
    title: str
    icon: str
    value: int
    target: int
    reward_gems: int
    done: bool


class RefillIn(BaseModel):
    method: Literal["gems"] = "gems"


class GoalIn(BaseModel):
    daily_goal: int


UserOut.model_rebuild()
