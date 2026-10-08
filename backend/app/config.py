"""Tunable knobs for the whole app. One place so the evaluator can find them."""
import os

# DB file lives next to the backend package, regardless of the process cwd.
_DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "duolingo.db")
DB_URL = os.getenv("DUO_DB_URL", f"sqlite:///{_DB_FILE}")

MAX_HEARTS = 5
HEART_REGEN_MINUTES = 30          # one heart back every 30 min
HEART_REFILL_GEM_COST = 350       # shop price, same as the real app
PRACTICE_HEART_REWARD = 1

XP_PER_LESSON = 10
XP_PER_PRACTICE = 5
XP_PERFECT_BONUS = 5
EXERCISES_PER_LESSON = 6
CROWNS_PER_SKILL = 5              # crown cap, matches the real app

DEFAULT_DAILY_GOAL = 20
CORS_ORIGINS = os.getenv("DUO_CORS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
