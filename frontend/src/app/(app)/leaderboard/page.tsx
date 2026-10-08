"use client";

/** Weekly XP leaderboard across the seeded users + the learner. */

import { useEffect, useState } from "react";
import { api, type Leaderboard } from "@/lib/api";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [board, setBoard] = useState<Leaderboard | null>(null);

  useEffect(() => {
    api.leaderboard().then(setBoard).catch(() => {});
  }, []);

  if (!board) return null;

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-6 text-center">
        <div className="mb-2 text-6xl">🛡️</div>
        <h1 className="text-2xl font-extrabold">{board.league}</h1>
        <p className="text-wolf dark:text-hare">
          Top 3 advance to the next league · resets weekly
        </p>
      </div>

      <ul className="overflow-hidden rounded-2xl border-2 border-swan dark:border-night-border">
        {board.rows.map((r) => (
          <li
            key={r.user_id}
            className={`flex items-center gap-4 border-b-2 border-swan px-4 py-3 last:border-0 dark:border-night-border ${
              r.is_me ? "bg-sky-50 dark:bg-night-card" : ""
            } ${r.rank === board.rows.length ? "text-cardinal" : ""}`}
          >
            <span className="w-8 text-center text-lg font-extrabold text-feather">
              {MEDALS[r.rank - 1] ?? r.rank}
            </span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-swan text-2xl dark:bg-night-border">
              {r.avatar_emoji}
            </span>
            <span className="flex-1 font-extrabold">
              {r.display_name}
              {r.is_me && <span className="ml-2 text-xs uppercase text-macaw">You</span>}
            </span>
            <span className="font-bold text-wolf dark:text-hare">{r.xp} XP</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between rounded-2xl border-2 border-swan p-3 text-sm font-bold text-wolf dark:border-night-border dark:text-hare">
        <span>⬆️ Promotion zone: top 3</span>
        <span>⬇️ Demotion zone: last place</span>
      </div>
    </div>
  );
}
