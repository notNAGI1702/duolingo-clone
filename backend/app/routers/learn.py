"""The learning path and skill detail."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import current_user
from app.models import Course, Skill, User
from app.schemas import PathOut, SkillOut
from app.serializers import path_out, progress_map, skill_out

router = APIRouter(prefix="/api", tags=["learn"])


@router.get("/path", response_model=PathOut)
def get_path(db: Session = Depends(get_db), user: User = Depends(current_user)):
    """Whole tree with per-skill lock/unlock + crown state for the current learner."""
    course = db.get(Course, user.course_id) if user.course_id else db.scalar(select(Course))
    if course is None:
        raise HTTPException(503, "No course seeded. Run: python -m app.seed")
    return path_out(db, user, course)


@router.get("/skills/{skill_id}", response_model=SkillOut)
def get_skill(
    skill_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    skill = db.get(Skill, skill_id)
    if skill is None:
        raise HTTPException(404, "Skill not found")
    return skill_out(db, skill, progress_map(db, user).get(skill.id), unlocked=True)
