"use client";

/** Top bar: course flag, streak, gems, hearts — visible on every learn page. */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@/components/UserContext";
import { FlameIcon, GemIcon, HeartIcon } from "@/components/icons";

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function StatBar() {
  const { me, refresh } = useUser();
  const [heartsOpen, setHeartsOpen] = useState(false);
  const [tick, setTick] = useState(0);

  // countdown to next heart; refetch when it elapses
  useEffect(() => {
    if (me?.seconds_to_next_heart == null) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [me?.seconds_to_next_heart]);

  const remaining =
    me?.seconds_to_next_heart != null ? Math.max(0, me.seconds_to_next_heart - tick) : null;
  useEffect(() => {
    if (remaining === 0) {
      setTick(0);
      refresh();
    }
  }, [remaining, refresh]);

  if (!me) return <div className="h-14" />;

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b-2 border-swan bg-snow px-4 py-3 dark:border-night-border dark:bg-night-bg sm:justify-end sm:gap-6 sm:border-0 sm:bg-transparent sm:dark:bg-transparent">
      <span className="text-2xl" title={`${me.course?.title ?? "Course"}`}>
        {me.course?.flag_emoji ?? "🏳️"}
      </span>

      <span
        className={`flex items-center gap-1.5 font-extrabold ${
          me.streak_active_today ? "text-fox" : "text-hare"
        }`}
        title={me.streak_active_today ? "Streak extended today!" : "Do a lesson to extend your streak"}
      >
        <FlameIcon lit={me.streak_active_today} /> {me.streak}
      </span>

      <span className="flex items-center gap-1.5 font-extrabold text-macaw" title="Gems">
        <GemIcon /> {me.gems}
      </span>

      <div className="relative">
        <button
          className="flex items-center gap-1.5 font-extrabold text-cardinal"
          onClick={() => setHeartsOpen((o) => !o)}
        >
          <HeartIcon /> {me.hearts}
        </button>
        {heartsOpen && (
          <div className="absolute right-0 top-10 z-50 w-72 animate-pop rounded-2xl border-2 border-swan bg-snow p-5 shadow-xl dark:border-night-border dark:bg-night-card">
            <p className="mb-1 text-center text-lg font-extrabold">Hearts</p>
            <div className="mb-3 flex justify-center gap-1">
              {Array.from({ length: me.max_hearts }).map((_, i) => (
                <HeartIcon key={i} className="h-8 w-8" empty={i >= me.hearts} />
              ))}
            </div>
            {me.hearts < me.max_hearts ? (
              <p className="mb-3 text-center text-sm text-wolf dark:text-hare">
                {remaining != null ? (
                  <>Next heart in <b>{fmt(remaining)}</b></>
                ) : (
                  "Keep practicing to earn hearts back"
                )}
              </p>
            ) : (
              <p className="mb-3 text-center text-sm text-wolf dark:text-hare">
                Your hearts are full!
              </p>
            )}
            <Link
              href="/lesson/practice"
              className="btn btn-blue w-full text-sm"
              onClick={() => setHeartsOpen(false)}
            >
              Practice to earn hearts
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
