"use client";

/** Daily quests computed by the backend from today's real activity. */

import { useEffect, useState } from "react";
import { api, type Quest } from "@/lib/api";
import { ProgressBar } from "@/components/RightRail";
import { useUser } from "@/components/UserContext";

const ICONS: Record<string, string> = { bolt: "⚡", book: "📖", heart: "💯" };

export default function QuestsPage() {
  const { me } = useUser();
  const [quests, setQuests] = useState<Quest[]>([]);

  useEffect(() => {
    api.quests().then(setQuests).catch(() => {});
  }, [me?.daily_xp]);

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-fox to-bee p-6 text-white">
        <div>
          <h1 className="text-2xl font-extrabold">Daily Quests</h1>
          <p className="font-bold opacity-90">Resets at midnight · rewards are gems</p>
        </div>
        <span className="text-6xl">🎯</span>
      </div>

      {quests.map((q) => (
        <div
          key={q.code}
          className="mb-4 flex items-center gap-4 rounded-2xl border-2 border-swan p-5 dark:border-night-border"
        >
          <span className="text-4xl">{q.done ? "✅" : ICONS[q.icon] ?? "🎯"}</span>
          <div className="flex-1">
            <p className="mb-2 font-extrabold">{q.title}</p>
            <ProgressBar value={q.value} max={q.target} className="bg-bee" />
            <p className="mt-1 text-sm font-bold text-wolf dark:text-hare">
              {q.value} / {q.target}
            </p>
          </div>
          <span className="flex flex-col items-center text-sm font-extrabold text-macaw">
            <span className="text-2xl">💎</span>+{q.reward_gems}
          </span>
        </div>
      ))}

      <div className="rounded-2xl border-2 border-dashed border-swan p-6 text-center font-bold text-hare dark:border-night-border">
        Friends Quests — Coming soon
      </div>
    </div>
  );
}
