# Duolingo Web App Clone

A functional clone of the Duolingo web application built for the SDE Fullstack
assignment. It recreates the learning path, the full lesson loop with five
interactive exercise types, and the gamification system (XP, streaks, hearts,
crowns, gems, daily quests, achievements, leaderboard) in Duolingo's visual
style.

![stack](https://img.shields.io/badge/Next.js-15-black) ![stack](https://img.shields.io/badge/FastAPI-0.115-009688) ![stack](https://img.shields.io/badge/SQLite-3-blue)

## Tech stack

| Layer    | Choice                                        |
| -------- | --------------------------------------------- |
| Frontend | Next.js 15 (App Router) · TypeScript · Tailwind CSS |
| Backend  | Python · FastAPI · SQLAlchemy 2               |
| Database | SQLite (schema designed from scratch, seeded) |
| Audio    | Browser SpeechSynthesis (TTS) + WebAudio jingles — zero dependencies |

## Setup

Prerequisites: **Python 3.11+** and **Node 18+**.

### 1. Backend (port 8000)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows   (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
python -m app.seed              # create + seed duolingo.db
uvicorn app.main:app --reload
```

Interactive API docs: http://localhost:8000/docs

### 2. Frontend (port 3000)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** — you are signed in as the seeded learner
(auth is simplified per the brief; `backend/app/deps.py` is the single place a
real session lookup would plug in).

### 3. Tests

```bash
cd backend
python -m pytest
```

8 end-to-end tests cover the lesson loop: wrong answers cost hearts, running
out of hearts fails the session and blocks new lessons, practice restores a
heart, completion awards XP and extends the streak, skipping a day resets the
streak, finishing all lessons in a skill earns a crown and unlocks the next
skill, and the leaderboard ranks seeded rivals.

## Features

### Core
- **Learning path** — 3 units × 12 skills in a serpentine layout with
  locked/available/active/complete states, crown badges, a progress ring on
  the active skill, the bouncing START bubble, unit banners and skill popovers.
- **Lesson player** — 5 exercise types: multiple choice (emoji tiles),
  translate with a tap-the-words word bank, match pairs (tap-to-match with
  instant per-pair feedback), fill-in-the-blank, and type-the-answer.
  Signature green/red feedback bar, lesson progress bar, Enter-to-continue,
  and missed exercises re-queued at the end of the lesson like the real app.
- **Hearts** — lose one per wrong answer; at zero the session fails and new
  lessons are blocked. Hearts regenerate one per 30 minutes (lazily computed),
  can be refilled for 350 gems in the shop, and a free **practice session**
  earns one back.
- **XP & streak** — XP per lesson (+5 perfect bonus), daily-goal ring,
  streak that extends on daily activity and resets after a missed day, with
  celebration screens (confetti, stat tiles, streak flame).
- **Crowns** — completing every lesson in a skill raises its crown level
  (max 5) and unlocks the next skill on the path.
- **Content & persistence** — the whole course (units → skills → lessons →
  144 exercises) lives in SQLite; every bit of learner progress persists.

### Bonus items implemented
- Audio: Spanish TTS on exercises + correct/incorrect jingles
- Achievements with 5 tiers each (Wildfire, Sage, Scholar, Champion, Sharpshooter)
- Real weekly leaderboard computed from per-day XP rows of 9 seeded rivals
- Dark mode (Settings → toggle)
- Responsive: desktop sidebar + right rail, tablet icon rail, mobile bottom tabs
- Daily quests computed from the day's real activity

### Mocked / placeholders (as allowed by the brief)
Speech exercises, Super subscription, friends/social, multiple languages,
guidebooks — surfaced as "Coming soon". Gems are a mocked currency (but the
heart refill purchase really works). Authentication is a fixed seeded learner.

### Demo tools
Streaks and heart regen are date-based, so **Settings → Demo tools** has a
"+1 day" button that advances a simulated clock (`app_state.day_offset`)
— do a lesson after pressing it to watch the streak extend, or skip 2+ days
to watch it reset. There's also a full progress reset.

## Architecture

```
frontend/ (Next.js, TypeScript)
  src/lib/api.ts              typed fetch wrapper — every backend call + response types
  src/components/             UserContext (global learner stats), Sidebar, StatBar,
                              RightRail, exercises.tsx (5 exercise components), icons.tsx
  src/app/(app)/              pages with the app shell: learn, leaderboard, quests,
                              shop, profile, settings
  src/app/lesson/[lessonId]/  full-screen lesson player (id or "practice")

backend/ (FastAPI)
  app/config.py               every tunable (hearts, XP, regen rate, costs)
  app/models.py               SQLAlchemy schema
  app/grading.py              server-side answer checking per exercise kind
  app/gamification.py         hearts regen, streak, XP, achievements + simulated clock
  app/serializers.py          model → response shaping (path lock/unlock logic)
  app/routers/                learn (path/skills), sessions (lesson loop),
                              users (profile/quests/shop/dev), leaderboard
  app/content.py + seed.py    course data + deterministic exercise generator
  tests/test_lesson_flow.py   end-to-end API tests
```

**Design decisions**

- **The server owns the game state.** Exercises are sent to the client with
  the `answer` column stripped; the client posts raw submissions and the
  server grades them (accent-forgiving text matching, pronoun-dropping
  alternates for Spanish), debits hearts, and awards XP. The client cannot
  cheat itself XP or hearts.
- **Lesson runs are first-class rows** (`lesson_sessions` + `session_answers`),
  which gives accuracy/duration stats, perfect-lesson achievements and an
  auditable history for free.
- **Exercises are generated, not hand-written.** `app/content.py` holds plain
  vocabulary/sentence data per skill; the seeder derives all five exercise
  types from it with distractors pulled from the same skill. Adding a skill
  is a data edit, not 12 exercise rows.
- **Time is injectable.** All date logic goes through one clock that a demo
  endpoint can offset, so the streak rules are testable (and demoable) in
  seconds.

## Database schema

```
courses 1─n units 1─n skills 1─n lessons 1─n exercises       (content, seeded)

users 1─n user_skill_progress (crowns, lessons_done; unique user+skill)
users 1─n lesson_sessions 1─n session_answers                (the lesson loop)
users 1─n daily_xp (per-day XP/lessons; unique user+day)     (goal ring, weekly board, streak)
users 1─n user_achievements n─1 achievements (tiered)
app_state (single row: simulated-clock day offset)
```

Key columns: `users` carries `total_xp, gems, hearts, hearts_updated_at,
streak, streak_last_day, daily_goal`; hearts are regenerated lazily from
`hearts_updated_at` on read, so no background jobs are needed. `exercises`
stores `kind`, a JSON `payload` (what the client renders) and a JSON `answer`
(what only the grader sees).

## API overview

| Method | Path                           | Purpose                                          |
| ------ | ------------------------------ | ------------------------------------------------ |
| GET    | `/api/me`                      | learner stats (hearts, streak, XP, daily goal)   |
| PATCH  | `/api/me/goal`                 | set daily XP goal                                |
| GET    | `/api/path`                    | full learning path with per-skill status         |
| GET    | `/api/skills/{id}`             | one skill + its lessons                          |
| POST   | `/api/lessons/{id}/start`      | open a lesson session (409 when out of hearts)   |
| POST   | `/api/practice/start`          | practice session over a completed lesson         |
| POST   | `/api/sessions/{id}/answer`    | grade one submission; may cost a heart           |
| POST   | `/api/sessions/{id}/complete`  | award XP/streak/crown; returns celebration data  |
| POST   | `/api/sessions/{id}/quit`      | abandon a session                                |
| GET    | `/api/leaderboard`             | weekly XP ranking                                |
| GET    | `/api/profile`                 | stats + achievements                             |
| GET    | `/api/quests`                  | today's quests from real activity                |
| POST   | `/api/hearts/refill`           | buy full hearts for gems                         |
| POST   | `/api/dev/advance-day`         | move the simulated clock (demo/testing)          |
| POST   | `/api/dev/reset-progress`      | fresh learner                                    |

Full request/response schemas: http://localhost:8000/docs

## Assumptions

- One seeded Spanish-from-English course is sufficient (per the brief).
- A single default learner stands in for authentication (per the brief).
- Flag/emoji rendering depends on the OS font (Windows shows "ES" text for
  the flag emoji); exercise emojis are decorative, the text is canonical.
- Grading is accent-forgiving (á == a) with a "pay attention to the accents"
  nudge, and accepts Spanish subject-pronoun-dropped variants.
- "Words learned" is approximated as distinct exercises answered correctly.
- Heart regeneration is 1 per 30 minutes (configurable in `app/config.py`).
