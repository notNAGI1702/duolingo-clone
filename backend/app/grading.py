"""Answer checking. One function per exercise kind, dispatched by `Exercise.kind`.

Grading never happens in the browser: the client is handed exercises with the
`answer` column stripped out and posts what the learner tapped.
"""
from __future__ import annotations

import re
import unicodedata

from app.models import Exercise

_PUNCT = re.compile(r"[^\w\s]", re.UNICODE)


def _norm(text: str, *, keep_accents: bool = False) -> str:
    text = text.strip().casefold()
    text = _PUNCT.sub("", text)
    text = re.sub(r"\s+", " ", text)
    if not keep_accents:
        text = "".join(c for c in unicodedata.normalize("NFD", text) if not unicodedata.combining(c))
    return text


def _text_match(given: str, accepted: list[str]) -> tuple[bool, str | None]:
    """Accent-forgiving comparison, like the real app: right answer, gentle nudge."""
    loose = _norm(given)
    for candidate in accepted:
        if _norm(candidate, keep_accents=True) == _norm(given, keep_accents=True):
            return True, None
        if _norm(candidate) == loose:
            return True, "Pay attention to the accents."
    return False, None


def solution_text(ex: Exercise) -> str:
    """Human-readable right answer for the red feedback bar."""
    ans = ex.answer or {}
    if ex.kind == "multiple_choice":
        wanted = ans.get("option_id")
        for opt in ex.payload.get("options", []):
            if opt["id"] == wanted:
                return opt["text"]
        return ""
    if ex.kind == "translate":
        return " ".join(ans.get("words", []))
    if ex.kind == "match_pairs":
        return ", ".join(f"{p['a']} = {p['b']}" for p in ex.payload.get("pairs", []))
    return str(ans.get("text", ""))


def grade(ex: Exercise, submitted: dict) -> tuple[bool, str | None]:
    """Return (is_correct, note)."""
    ans = ex.answer or {}

    if ex.kind == "multiple_choice":
        return submitted.get("option_id") == ans.get("option_id"), None

    if ex.kind == "translate":
        words = [str(w) for w in submitted.get("words", [])]
        candidates = [ans.get("words", [])] + [list(a) for a in ans.get("alternates", [])]
        given = _norm(" ".join(words))
        for cand in candidates:
            if _norm(" ".join(cand)) == given:
                return True, None
        return False, None

    if ex.kind == "match_pairs":
        pairs = {(_norm(p["a"]), _norm(p["b"])) for p in ex.payload.get("pairs", [])}
        got = {
            (_norm(str(p.get("a", ""))), _norm(str(p.get("b", ""))))
            for p in submitted.get("pairs", [])
        }
        return got == pairs, None

    if ex.kind in ("fill_blank", "type_answer"):
        accepted = [ans.get("text", "")] + list(ans.get("alternates", []))
        return _text_match(str(submitted.get("text", "")), accepted)

    raise ValueError(f"unknown exercise kind: {ex.kind}")
