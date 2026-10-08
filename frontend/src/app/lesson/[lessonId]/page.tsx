"use client";

/** The lesson player: exercise queue, hearts, feedback bar, completion flow.
 *  Route handles both /lesson/<id> and /lesson/practice. */

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  ApiError,
  type AnswerResult,
  type CompleteResult,
  type Exercise,
  type LessonSession,
} from "@/lib/api";
import { ding, speak } from "@/lib/audio";
import { useUser } from "@/components/UserContext";
import {
  MatchPairs,
  MultipleChoice,
  Translate,
  TypeAnswer,
  FillBlank,
  type AnswerValue,
} from "@/components/exercises";
import { CheckIcon, FlameIcon, HeartIcon, Owl } from "@/components/icons";

const PRAISE = ["Nicely done!", "Excellent!", "Great job!", "Amazing!", "You got it!"];

function Confetti() {
  const colors = ["#58CC02", "#1CB0F6", "#FF4B4B", "#FFC800", "#CE82FF", "#FF9600"];
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="absolute block h-3 w-2 animate-confetti rounded-sm"
          style={{
            left: `${(i * 97) % 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 10) * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="w-32 overflow-hidden rounded-2xl border-2 text-center" style={{ borderColor: color }}>
      <p className="py-1 text-xs font-extrabold uppercase text-white" style={{ background: color }}>
        {label}
      </p>
      <p className="py-3 text-xl font-extrabold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

export default function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = use(params);
  const router = useRouter();
  const { refresh } = useUser();

  const [session, setSession] = useState<LessonSession | null>(null);
  const [queue, setQueue] = useState<Exercise[]>([]);
  const [solved, setSolved] = useState(0);
  const [answer, setAnswer] = useState<AnswerValue>(null);
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [hearts, setHearts] = useState(0);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CompleteResult | null>(null);
  const [screen, setScreen] = useState<"lesson" | "complete" | "streak" | "failed" | "no-hearts">("lesson");
  const [quitOpen, setQuitOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const started = useRef(false);

  const total = session?.exercises.length ?? 1;
  const current = queue[0] ?? null;

  useEffect(() => {
    if (started.current) return; // React 18 strict-mode double-mount guard
    started.current = true;
    const start = lessonId === "practice" ? api.startPractice() : api.startLesson(Number(lessonId));
    start
      .then((s) => {
        setSession(s);
        setQueue(s.exercises);
        setHearts(s.hearts);
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 409) setScreen("no-hearts");
        else router.push("/learn");
      });
  }, [lessonId, router]);

  const check = useCallback(async () => {
    if (!session || !current || !answer || checking || feedback) return;
    setChecking(true);
    try {
      const r = await api.answer(session.session_id, current.id, answer);
      setFeedback(r);
      setHearts(r.hearts);
      ding(r.correct);
      if (r.correct && current.audio_text) setTimeout(() => speak(current.audio_text!), 350);
    } finally {
      setChecking(false);
    }
  }, [session, current, answer, checking, feedback]);

  const finish = useCallback(async () => {
    if (!session) return;
    const r = await api.complete(session.session_id);
    setResult(r);
    setScreen("complete");
    refresh();
  }, [session, refresh]);

  const next = useCallback(() => {
    if (!feedback) return;
    if (feedback.out_of_hearts && session?.mode === "lesson") {
      setScreen("failed");
      return;
    }
    const [head, ...rest] = queue;
    const nq = feedback.correct ? rest : [...rest, head]; // missed ones come back
    setQueue(nq);
    setAttempt((n) => n + 1);
    if (feedback.correct) setSolved((n) => n + 1);
    setAnswer(null);
    setFeedback(null);
    if (nq.length === 0) finish().catch(() => router.push("/learn"));
  }, [feedback, session, queue, finish, router]);

  // Enter advances / checks
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (e.target instanceof HTMLTextAreaElement && !feedback) return;
      e.preventDefault();
      if (feedback) next();
      else check();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [feedback, next, check]);

  const quit = async () => {
    if (session) await api.quit(session.session_id).catch(() => {});
    refresh();
    router.push("/learn");
  };

  // ------------------------------------------------------------ end screens

  if (screen === "no-hearts") {
    return (
      <Center>
        <Owl mood="sad" className="h-32 w-32" />
        <h1 className="text-2xl font-extrabold">You ran out of hearts!</h1>
        <p className="max-w-sm text-center text-wolf dark:text-hare">
          Wait for them to regenerate, refill in the shop, or do a practice session to earn one back.
        </p>
        <button className="btn btn-blue w-72" onClick={() => location.assign("/lesson/practice")}>
          Practice to earn hearts
        </button>
        <button className="btn btn-white w-72" onClick={() => router.push("/shop")}>
          Go to shop
        </button>
      </Center>
    );
  }

  if (screen === "failed") {
    return (
      <Center>
        <Owl mood="sad" className="h-32 w-32" />
        <h1 className="text-2xl font-extrabold">You ran out of hearts!</h1>
        <p className="max-w-sm text-center text-wolf dark:text-hare">
          Don&apos;t worry — your progress in this lesson isn&apos;t lost forever. Practice to earn a
          heart and try again.
        </p>
        <button className="btn btn-blue w-72" onClick={() => location.assign("/lesson/practice")}>
          Practice to earn hearts
        </button>
        <button className="btn btn-white w-72" onClick={quit}>
          End session
        </button>
      </Center>
    );
  }

  if (screen === "complete" && result) {
    return (
      <Center>
        <Confetti />
        <Owl mood="cheer" className="h-36 w-36 animate-bounce2" />
        <h1 className="text-3xl font-extrabold text-bee">
          {result.crown_earned ? "Crown earned!" : "Lesson complete!"}
        </h1>
        {result.crown_earned && (
          <p className="font-bold text-wolf dark:text-hare">
            {result.skill_title} is now crown level {result.crowns} 👑
          </p>
        )}
        <div className="my-4 flex flex-wrap justify-center gap-4">
          <StatTile label="Total XP" value={`+${result.xp_earned}`} color="#FFC800" />
          <StatTile label="Amazing" value={`${result.accuracy}%`} color="#58CC02" />
          <StatTile
            label="Speedy"
            value={`${Math.floor(result.duration_seconds / 60)}:${String(result.duration_seconds % 60).padStart(2, "0")}`}
            color="#1CB0F6"
          />
        </div>
        {result.new_achievements.length > 0 && (
          <div className="rounded-2xl border-2 border-bee bg-amber-50 px-5 py-3 text-center font-bold text-fox dark:bg-night-card">
            🏅 Achievement{result.new_achievements.length > 1 ? "s" : ""} unlocked:{" "}
            {result.new_achievements.map((a) => a.title).join(", ")}
          </div>
        )}
        {result.daily_goal_reached && (
          <p className="font-bold text-feather">⚡ Daily goal reached — {result.daily_xp} XP today!</p>
        )}
        <button
          className="btn btn-green w-72"
          onClick={() => (result.streak_extended ? setScreen("streak") : (refresh(), router.push("/learn")))}
        >
          Continue
        </button>
      </Center>
    );
  }

  if (screen === "streak" && result) {
    return (
      <Center>
        <FlameIcon className="h-40 w-40" />
        <h1 className="text-5xl font-extrabold text-fox">{result.streak} day streak!</h1>
        <p className="max-w-sm text-center font-bold text-wolf dark:text-hare">
          A streak counts how many days in a row you&apos;ve met your goal. Come back tomorrow to
          keep it alive!
        </p>
        <button className="btn btn-green w-72" onClick={() => (refresh(), router.push("/learn"))}>
          Continue
        </button>
      </Center>
    );
  }

  if (!session || !current) {
    return (
      <Center>
        <Owl className="h-24 w-24 animate-bounce2" />
      </Center>
    );
  }

  // --------------------------------------------------------------- the lesson

  const canCheck = answer != null && !feedback;
  const progress = solved / total;

  return (
    <div className="flex min-h-screen flex-col">
      {/* top bar */}
      <header className="mx-auto flex w-full max-w-3xl items-center gap-4 px-4 py-4">
        <button aria-label="Quit lesson" className="text-2xl text-hare hover:text-wolf" onClick={() => setQuitOpen(true)}>
          ✕
        </button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-swan dark:bg-night-border">
          <div
            className="h-full rounded-full bg-feather transition-all duration-500"
            style={{ width: `${Math.max(2, progress * 100)}%` }}
          />
        </div>
        {session.mode === "lesson" ? (
          <span className="flex items-center gap-1.5 font-extrabold text-cardinal">
            <HeartIcon /> {hearts}
          </span>
        ) : (
          <span className="text-sm font-extrabold uppercase text-macaw">Practice</span>
        )}
      </header>

      {/* exercise */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-44 pt-4">
        <h1 className="mb-6 text-2xl font-extrabold">{current.prompt}</h1>
        {current.kind === "multiple_choice" && (
          <MultipleChoice key={`${current.id}-${attempt}`} exercise={current} value={answer} onChange={setAnswer} locked={!!feedback} />
        )}
        {current.kind === "translate" && (
          <Translate key={`${current.id}-${attempt}`} exercise={current} value={answer} onChange={setAnswer} locked={!!feedback} />
        )}
        {current.kind === "match_pairs" && (
          <MatchPairs
            key={`${current.id}-${attempt}`}
            exercise={current}
            locked={!!feedback}
            onSolved={() => setAnswer({ pairs: current.payload.pairs })}
          />
        )}
        {current.kind === "fill_blank" && (
          <FillBlank key={`${current.id}-${attempt}`} exercise={current} value={answer} onChange={setAnswer} locked={!!feedback} />
        )}
        {current.kind === "type_answer" && (
          <TypeAnswer key={`${current.id}-${attempt}`} exercise={current} value={answer} onChange={setAnswer} locked={!!feedback} />
        )}
      </main>

      {/* footer / feedback bar */}
      <footer
        className={`fixed inset-x-0 bottom-0 border-t-2 ${
          feedback
            ? feedback.correct
              ? "border-transparent bg-[#D7FFB8] dark:bg-[#1f3a19]"
              : "border-transparent bg-[#FFDFE0] dark:bg-[#3a1919]"
            : "border-swan bg-snow dark:border-night-border dark:bg-night-bg"
        }`}
      >
        <div className="mx-auto flex min-h-[110px] w-full max-w-3xl flex-col justify-center gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          {feedback ? (
            <div className={`animate-slide-up ${feedback.correct ? "text-feather-dark" : "text-cardinal-dark"}`}>
              <p className="flex items-center gap-2 text-xl font-extrabold">
                {feedback.correct ? (
                  <>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-feather">
                      <CheckIcon className="h-5 w-5" />
                    </span>
                    {PRAISE[solved % PRAISE.length]}
                  </>
                ) : (
                  <>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-cardinal">✕</span>
                    Correct solution:
                  </>
                )}
              </p>
              {!feedback.correct && <p className="ml-11 font-bold">{feedback.solution}</p>}
              {feedback.note && <p className="ml-11 text-sm font-bold">{feedback.note}</p>}
            </div>
          ) : (
            <button className="btn btn-white hidden w-40 sm:flex" onClick={() => setQuitOpen(true)}>
              Skip
            </button>
          )}
          {feedback ? (
            <button
              className={`btn w-full sm:w-44 ${feedback.correct ? "btn-green" : "btn-red"}`}
              onClick={next}
            >
              Continue
            </button>
          ) : (
            <button className="btn btn-green w-full sm:w-44" disabled={!canCheck || checking} onClick={check}>
              Check
            </button>
          )}
        </div>
      </footer>

      {/* quit confirm */}
      {quitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm animate-pop rounded-3xl bg-snow p-6 text-center dark:bg-night-card">
            <Owl mood="sad" className="mx-auto h-24 w-24" />
            <h2 className="mb-1 text-xl font-extrabold">Wait, don&apos;t go!</h2>
            <p className="mb-5 text-wolf dark:text-hare">
              You&apos;ll lose your progress in this lesson if you quit now.
            </p>
            <button className="btn btn-green mb-2 w-full" onClick={() => setQuitOpen(false)}>
              Keep learning
            </button>
            <button className="btn w-full border-0 bg-transparent !text-cardinal" onClick={quit}>
              End session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      {children}
    </div>
  );
}
