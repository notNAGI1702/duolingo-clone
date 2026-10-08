"use client";

/** Right-hand column on desktop: daily goal, quest preview, promo card. */

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Quest } from "@/lib/api";
import { useUser } from "@/components/UserContext";
import { BoltIcon } from "@/components/icons";

export function ProgressBar({
  value,
  max,
  className = "bg-feather",
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div className="h-4 w-full overflow-hidden rounded-full bg-swan dark:bg-night-border">
      <div
        className={`h-full rounded-full transition-all duration-500 ${className}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function RightRail() {
  const { me } = useUser();
  const [quests, setQuests] = useState<Quest[]>([]);

  useEffect(() => {
    api.quests().then(setQuests).catch(() => {});
  }, [me?.daily_xp]);

  return (
    <aside className="sticky top-0 hidden h-screen w-96 shrink-0 flex-col gap-5 overflow-y-auto p-6 xl:flex">
      <div className="rounded-2xl border-2 border-swan p-5 dark:border-night-border">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-extrabold">Daily Goal</h3>
          <Link href="/settings" className="text-sm font-bold uppercase text-macaw">
            Edit
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <BoltIcon className="h-9 w-9" />
          <div className="flex-1">
            <ProgressBar value={me?.daily_xp ?? 0} max={me?.daily_goal ?? 20} className="bg-bee" />
            <p className="mt-1 text-sm font-bold text-wolf dark:text-hare">
              {Math.min(me?.daily_xp ?? 0, me?.daily_goal ?? 20)} / {me?.daily_goal ?? 20} XP
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-swan p-5 dark:border-night-border">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-extrabold">Daily Quests</h3>
          <Link href="/quests" className="text-sm font-bold uppercase text-macaw">
            View all
          </Link>
        </div>
        {quests.slice(0, 2).map((q) => (
          <div key={q.code} className="mb-3 flex items-center gap-3 last:mb-0">
            <span className="text-3xl">{q.done ? "✅" : q.icon === "bolt" ? "⚡" : q.icon === "book" ? "📖" : "💯"}</span>
            <div className="flex-1">
              <p className="mb-1 text-sm font-bold">{q.title}</p>
              <ProgressBar value={q.value} max={q.target} className="bg-bee" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border-2 border-swan p-5 dark:border-night-border">
        <h3 className="mb-2 text-lg font-extrabold">Super Duolingo</h3>
        <p className="mb-3 text-sm text-wolf dark:text-hare">
          No ads, unlimited hearts, and legendary challenges. Coming soon!
        </p>
        <button className="btn btn-white w-full text-sm" disabled>
          Coming soon
        </button>
      </div>
    </aside>
  );
}
