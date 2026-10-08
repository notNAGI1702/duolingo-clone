"""End-to-end check of the lesson loop and gamification rules.

Run from backend/:  python -m pytest
Uses its own throwaway SQLite file so it never touches duolingo.db.
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["DUO_DB_URL"] = "sqlite:///./test_duolingo.db"

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client():
    from app import seed

    seed.seed()
    from app.main import app

    with TestClient(app) as c:
        yield c
    for suffix in ("", "-journal"):
        try:
            os.remove(f"test_duolingo.db{suffix}")
        except OSError:
            pass


def _first_available_lesson(client) -> int:
    path = client.get("/api/path").json()
    skill = next(
        s
        for u in path["units"]
        for s in u["skills"]
        if s["status"] in ("available", "active")
    )
    return skill["next_lesson_id"]


def test_health(client):
    assert client.get("/api/health").json()["status"] == "ok"


def test_me_seeded(client):
    me = client.get("/api/me").json()
    assert me["username"] == "Ronit"
    assert me["hearts"] == 5
    assert me["streak"] == 5


def test_wrong_answer_costs_a_heart_and_out_of_hearts_fails_session(client):
    lesson_id = _first_available_lesson(client)
    start = client.post(f"/api/lessons/{lesson_id}/start").json()
    ex = start["exercises"][0]
    hearts = 5
    for _ in range(5):
        r = client.post(
            f"/api/sessions/{start['session_id']}/answer",
            json={"exercise_id": ex["id"], "answer": {"text": "zzz", "words": ["zzz"], "option_id": -1, "pairs": []}},
        ).json()
        assert r["correct"] is False
        hearts -= 1
        assert r["hearts"] == hearts
    assert r["out_of_hearts"] is True
    # failed session cannot be completed
    assert client.post(f"/api/sessions/{start['session_id']}/complete").status_code == 409
    # and no new lesson can start with zero hearts
    assert client.post(f"/api/lessons/{lesson_id}/start").status_code == 409


def test_practice_restores_a_heart_and_completion_awards_xp_and_streak(client):
    me_before = client.get("/api/me").json()
    assert me_before["hearts"] == 0

    start = client.post("/api/practice/start").json()
    sid = start["session_id"]
    # answer every exercise correctly via match_pairs when possible, otherwise
    # brute-force isn't needed: completion doesn't require answers, but hearts
    # aren't lost in practice mode even on mistakes.
    r = client.post(
        f"/api/sessions/{sid}/answer",
        json={"exercise_id": start["exercises"][0]["id"], "answer": {"text": "zzz"}},
    ).json()
    assert r["hearts"] == 0  # practice never costs hearts

    done = client.post(f"/api/sessions/{sid}/complete").json()
    assert done["state"] == "passed"
    assert done["xp_earned"] >= 5
    assert done["hearts"] == 1  # practice reward
    assert done["streak"] == 6  # yesterday's streak of 5 extended today
    assert done["streak_extended"] is True

    me_after = client.get("/api/me").json()
    assert me_after["total_xp"] == me_before["total_xp"] + done["xp_earned"]
    assert me_after["daily_xp"] >= done["xp_earned"]


def test_match_pairs_grades_correct(client):
    start = client.post("/api/practice/start").json()
    match = next((e for e in start["exercises"] if e["kind"] == "match_pairs"), None)
    assert match is not None
    r = client.post(
        f"/api/sessions/{start['session_id']}/answer",
        json={"exercise_id": match["id"], "answer": {"pairs": match["payload"]["pairs"]}},
    ).json()
    assert r["correct"] is True


def test_advance_day_then_gap_resets_streak(client):
    client.post("/api/dev/advance-day", json={"days": 2})  # skip a day -> streak broken
    start = client.post("/api/practice/start").json()
    done = client.post(f"/api/sessions/{start['session_id']}/complete").json()
    assert done["streak"] == 1  # reset, not extended


def test_crown_after_finishing_all_lessons_in_skill(client):
    path = client.get("/api/path").json()
    skill = next(
        s
        for u in path["units"]
        for s in u["skills"]
        if s["status"] in ("available", "active")
    )
    before = skill["crowns"]
    for _ in range(skill["total_lessons"] - skill["lessons_done"]):
        skill_now = client.get(f"/api/skills/{skill['id']}").json()
        start = client.post(f"/api/lessons/{skill_now['next_lesson_id']}/start").json()
        done = client.post(f"/api/sessions/{start['session_id']}/complete").json()
    assert done["crown_earned"] is True
    assert done["crowns"] == before + 1
    # next skill on the path should now be unlocked
    path2 = client.get("/api/path").json()
    statuses = [s["status"] for u in path2["units"] for s in u["skills"]]
    assert statuses.count("locked") < len(statuses) - 1


def test_leaderboard_has_rivals_and_me(client):
    rows = client.get("/api/leaderboard").json()["rows"]
    assert len(rows) == 10
    assert any(r["is_me"] for r in rows)
    assert rows[0]["xp"] >= rows[-1]["xp"]
