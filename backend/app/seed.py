"""Seed the database:  python -m app.seed

Drops everything, then builds the Spanish course (units -> skills -> lessons ->
exercises generated from app/content.py), the default learner with some progress,
nine leaderboard rivals, and the achievement catalogue.
"""
from __future__ import annotations

import datetime as dt
import random

from app.config import EXERCISES_PER_LESSON, XP_PER_LESSON
from app.content import ACHIEVEMENTS, COURSE, RIVALS, UNITS
from app.db import Base, SessionLocal, engine
from app.models import (
    Achievement,
    AppState,
    Course,
    DailyXP,
    Exercise,
    Lesson,
    Skill,
    Unit,
    User,
    UserSkillProgress,
)

rng = random.Random(7)  # deterministic seed -> same DB every run

LESSONS_PER_SKILL = 2

# Subject pronouns that Spanish happily drops -- used to build accepted alternates.
_PRONOUNS = ("Yo ", "Tú ", "Él ", "Ella ", "Nosotros ", "Nosotras ", "Ellos ", "Ellas ")


def _alternates(spanish: str) -> list[str]:
    for p in _PRONOUNS:
        if spanish.startswith(p):
            rest = spanish[len(p):]
            return [rest[0].upper() + rest[1:]]
    return []


def _bank(words: list[str], pool: list[str], size: int = 3) -> list[str]:
    """Word tiles: the correct words plus a few distractors, shuffled."""
    used = {w.lower() for w in words}
    distractors = [w for w in pool if w.lower() not in used]
    rng.shuffle(distractors)
    tiles = words + distractors[:size]
    rng.shuffle(tiles)
    return tiles


def make_exercises(skill_def: dict, all_words: list[tuple]) -> list[dict]:
    """Build LESSONS_PER_SKILL x EXERCISES_PER_LESSON exercises for one skill."""
    words = skill_def["words"]
    sentences = skill_def["sentences"]
    exercises: list[dict] = []

    en_pool = [tok for en, es in sentences for tok in en.split()]
    es_pool = [tok for en, es in sentences for tok in es.split()]

    def mc(i: int) -> dict:
        en, es, emoji = words[i % len(words)]
        options = [words[i % len(words)]]
        others = [w for w in words if w[1] != es]
        rng.shuffle(others)
        options += others[:2]
        rng.shuffle(options)
        return {
            "kind": "multiple_choice",
            "prompt": f'Which one of these is "{en}"?',
            "payload": {
                "options": [
                    {"id": n + 1, "text": o[1], "emoji": o[2]} for n, o in enumerate(options)
                ]
            },
            "answer": {"option_id": next(n + 1 for n, o in enumerate(options) if o[1] == es)},
            "audio_text": es,
        }

    def translate_to_en(i: int) -> dict:
        en, es = sentences[i % len(sentences)]
        return {
            "kind": "translate",
            "prompt": "Write this in English",
            "payload": {"source": es, "bank": _bank(en.split(), en_pool)},
            "answer": {"words": en.split(), "alternates": []},
            "audio_text": es,
        }

    def translate_to_es(i: int) -> dict:
        en, es = sentences[(i + 1) % len(sentences)]
        alts = [a.split() for a in _alternates(es)]
        return {
            "kind": "translate",
            "prompt": "Write this in Spanish",
            "payload": {"source": en, "bank": _bank(es.split(), es_pool)},
            "answer": {"words": es.split(), "alternates": alts},
            "audio_text": es,
        }

    def match(i: int) -> dict:
        picks = list(words)
        rng.shuffle(picks)
        picks = picks[:5]
        return {
            "kind": "match_pairs",
            "prompt": "Tap the matching pairs",
            "payload": {"pairs": [{"a": en, "b": es} for en, es, _ in picks]},
            "answer": {},
            "audio_text": None,
        }

    def fill(i: int) -> dict:
        en, es = sentences[(i + 2) % len(sentences)]
        tokens = es.split()
        # blank a meaty word, not punctuation-heavy openers
        idx = max(range(len(tokens)), key=lambda n: len(tokens[n].strip("¿?¡!,.")))
        blank = tokens[idx].strip("¿?¡!,.")
        distractors = [
            w for _, w, _ in words if " " not in w and w.lower() != blank.lower()
        ] or [t.strip("¿?¡!,.") for t in es_pool if t.strip("¿?¡!,.").lower() != blank.lower()]
        rng.shuffle(distractors)
        options = [blank] + distractors[:2]
        rng.shuffle(options)
        return {
            "kind": "fill_blank",
            "prompt": "Fill in the blank",
            "payload": {
                "before": " ".join(tokens[:idx]),
                "after": " ".join(tokens[idx + 1:]),
                "hint": en,
                "options": options,
            },
            "answer": {"text": blank},
            "audio_text": None,
        }

    def type_answer(i: int) -> dict:
        en, es = sentences[(i + 3) % len(sentences)]
        return {
            "kind": "type_answer",
            "prompt": "Write this in Spanish",
            "payload": {"source": en},
            "answer": {"text": es, "alternates": _alternates(es)},
            "audio_text": es,
        }

    makers = [mc, translate_to_en, match, fill, translate_to_es, type_answer]
    for lesson_i in range(LESSONS_PER_SKILL):
        order = makers[lesson_i:] + makers[:lesson_i]  # vary the rhythm per lesson
        for n in range(EXERCISES_PER_LESSON):
            ex = order[n % len(order)](lesson_i * EXERCISES_PER_LESSON + n)
            ex["lesson_index"] = lesson_i
            exercises.append(ex)
    return exercises


def seed() -> None:
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    db = SessionLocal()

    course = Course(**COURSE)
    db.add(course)
    db.flush()

    all_words = [w for u in UNITS for s in u["skills"] for w in s["words"]]
    skills_by_title: dict[str, Skill] = {}

    for u_pos, unit_def in enumerate(UNITS):
        unit = Unit(
            course_id=course.id,
            position=u_pos,
            title=unit_def["title"],
            description=unit_def["description"],
            color=unit_def["color"],
        )
        db.add(unit)
        db.flush()
        for s_pos, skill_def in enumerate(unit_def["skills"]):
            skill = Skill(
                unit_id=unit.id,
                position=s_pos,
                title=skill_def["title"],
                icon=skill_def["icon"],
                kind="lesson",
            )
            db.add(skill)
            db.flush()
            skills_by_title[skill.title] = skill

            lessons = [
                Lesson(
                    skill_id=skill.id,
                    position=i,
                    title=f"{skill.title} · Lesson {i + 1}",
                    xp_reward=XP_PER_LESSON,
                )
                for i in range(LESSONS_PER_SKILL)
            ]
            db.add_all(lessons)
            db.flush()

            for pos, ex in enumerate(make_exercises(skill_def, all_words)):
                db.add(
                    Exercise(
                        lesson_id=lessons[ex["lesson_index"]].id,
                        position=pos % EXERCISES_PER_LESSON,
                        kind=ex["kind"],
                        prompt=ex["prompt"],
                        payload=ex["payload"],
                        answer=ex["answer"],
                        audio_text=ex["audio_text"],
                    )
                )

    # ---------------------------------------------------------------- learners
    today = dt.date.today()
    me = User(
        username="Ronit",
        display_name="Ronit",
        avatar_emoji="🦉",
        course_id=course.id,
        total_xp=0,
        gems=500,
        hearts=5,
        streak=5,
        streak_last_day=today - dt.timedelta(days=1),  # first lesson today extends it
        daily_goal=20,
    )
    db.add(me)
    db.flush()

    # A believable week of activity behind the streak.
    for back, xp in ((1, 30), (2, 20), (3, 25), (4, 10), (5, 35)):
        db.add(DailyXP(user_id=me.id, day=today - dt.timedelta(days=back), xp=xp, lessons=2))
        me.total_xp += xp

    # Part-way down the path: two skills crowned, one in progress.
    for title, crowns, done in (("Basics 1", 1, 1), ("Greetings", 1, 0), ("Travel", 0, 1)):
        db.add(
            UserSkillProgress(
                user_id=me.id,
                skill_id=skills_by_title[title].id,
                crowns=crowns,
                lessons_done=done,
            )
        )

    for username, name, avatar, weekly in RIVALS:
        rival = User(
            username=username,
            display_name=name,
            avatar_emoji=avatar,
            course_id=course.id,
            total_xp=weekly * 4,
            is_seed_rival=True,
        )
        db.add(rival)
        db.flush()
        # spread their weekly XP over Mon..today so the weekly board is non-trivial
        monday = today - dt.timedelta(days=today.weekday())
        days = (today - monday).days + 1
        per_day = max(1, weekly // days)
        left = weekly
        for d in range(days):
            amount = per_day if d < days - 1 else left
            db.add(DailyXP(user_id=rival.id, day=monday + dt.timedelta(days=d), xp=amount, lessons=1))
            left -= per_day

    db.add_all(Achievement(**a) for a in ACHIEVEMENTS)
    db.add(AppState(id=1, day_offset=0))
    db.commit()

    counts = {
        "units": db.query(Unit).count(),
        "skills": db.query(Skill).count(),
        "lessons": db.query(Lesson).count(),
        "exercises": db.query(Exercise).count(),
        "users": db.query(User).count(),
    }
    db.close()
    print("Seeded:", counts)


if __name__ == "__main__":
    seed()
