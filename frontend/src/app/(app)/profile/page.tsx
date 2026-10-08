"use client";

/** Learner profile: identity, statistics, achievements with tier progress. */

import { useEffect, useState } from "react";
import { api, type Profile } from "@/lib/api";
import { ProgressBar } from "@/components/RightRail";
import { useUser } from "@/components/UserContext";

const ACH_ICONS: Record<string, string> = {
  flame: "🔥",
  sage: "🧙",
  scholar: "🎓",
  crown: "👑",
  target: "🎯",
};

function Stat({ icon, value, label }: { icon: string; value: number | string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-swan p-4 dark:border-night-border">
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-lg font-extrabold">{value}</p>
        <p className="text-sm font-bold text-wolf dark:text-hare">{label}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { me } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    api.profile().then(setProfile).catch(() => {});
  }, [me?.total_xp]);

  if (!profile) return null;
  const u = profile.user;

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      {/* header */}
      <div className="mb-6 border-b-2 border-swan pb-6 dark:border-night-border">
        <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-full border-4 border-swan bg-polar text-6xl dark:border-night-border dark:bg-night-card">
          {u.avatar_emoji}
        </div>
        <h1 className="text-2xl font-extrabold">{u.display_name}</h1>
        <p className="font-bold text-wolf dark:text-hare">@{u.username}</p>
        <p className="mt-1 text-sm font-bold text-wolf dark:text-hare">
          Joined {new Date(profile.joined).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <p className="mt-2 text-sm font-bold">
          <span className="text-macaw">{profile.following} Following</span>
          <span className="mx-2 text-hare">·</span>
          <span className="text-macaw">{profile.followers} Followers</span>
        </p>
        <p className="mt-3 text-2xl" title={u.course?.title}>
          {u.course?.flag_emoji}
        </p>
      </div>

      {/* statistics */}
      <h2 className="mb-3 text-xl font-extrabold">Statistics</h2>
      <div className="mb-8 grid grid-cols-2 gap-3">
        <Stat icon="🔥" value={u.streak} label="Day streak" />
        <Stat icon="⚡" value={u.total_xp} label="Total XP" />
        <Stat icon="👑" value={profile.crowns} label="Crowns" />
        <Stat icon="📚" value={profile.lessons_completed} label="Lessons done" />
        <Stat icon="🧠" value={profile.words_learned} label="Words learned" />
        <Stat icon="💯" value={profile.perfect_lessons} label="Perfect lessons" />
      </div>

      {/* achievements */}
      <h2 className="mb-3 text-xl font-extrabold">Achievements</h2>
      <div className="overflow-hidden rounded-2xl border-2 border-swan dark:border-night-border">
        {profile.achievements.map((a) => (
          <div
            key={a.code}
            className="flex items-center gap-4 border-b-2 border-swan p-4 last:border-0 dark:border-night-border"
          >
            <span
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl ${
                a.tier > 0 ? "bg-bee" : "bg-swan grayscale dark:bg-night-border"
              }`}
            >
              {ACH_ICONS[a.icon] ?? "🏅"}
            </span>
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-extrabold">
                  {a.title}
                  {a.tier > 0 && (
                    <span className="ml-2 text-sm font-bold text-wolf dark:text-hare">
                      Level {a.tier}/{a.max_tier}
                    </span>
                  )}
                </p>
                <p className="text-sm font-bold text-wolf dark:text-hare">
                  {Math.min(a.value, a.next_threshold)}/{a.next_threshold}
                </p>
              </div>
              <p className="mb-2 text-sm text-wolf dark:text-hare">{a.description}</p>
              <ProgressBar value={a.value} max={a.next_threshold} className="bg-bee" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
