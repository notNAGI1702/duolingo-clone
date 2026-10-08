"""FastAPI entrypoint.

    uvicorn app.main:app --reload
Interactive API docs: http://localhost:8000/docs
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.db import Base, engine
from app.routers import leaderboard, learn, sessions, users

app = FastAPI(
    title="Duolingo Clone API",
    description="Courses, the lesson loop, and gamification for the Duolingo web clone.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(engine)

app.include_router(users.router)
app.include_router(learn.router)
app.include_router(sessions.router)
app.include_router(leaderboard.router)


@app.get("/api/health", tags=["meta"])
def health():
    return {"status": "ok"}
