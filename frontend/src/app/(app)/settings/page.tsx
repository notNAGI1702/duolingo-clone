"use client";

/** Settings: daily goal (working), dark mode (working), placeholders, and the
 *  demo clock used to showcase streak/heart-regen logic. */

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useUser } from "@/components/UserContext";

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b-2 border-swan py-4 last:border-0 dark:border-night-border">
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { me, setMe, refresh } = useUser();
  const [dark, setDark] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.theme = next ? "dark" : "light";
    } catch {}
  };

  const toast = (t: string) => {
    setMsg(t);
    setTimeout(() => setMsg(null), 2500);
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-extrabold">Settings</h1>

      {msg && (
        <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 animate-pop rounded-2xl bg-eel px-6 py-3 font-bold text-white shadow-xl">
          {msg}
        </div>
      )}

      <h2 className="mb-1 text-lg font-extrabold text-wolf dark:text-hare">Preferences</h2>
      <div className="mb-8 rounded-2xl border-2 border-swan px-5 dark:border-night-border">
        <Row>
          <div>
            <p className="font-extrabold">Daily goal</p>
            <p className="text-sm text-wolf dark:text-hare">XP you aim to earn every day</p>
          </div>
          <div className="flex gap-2">
            {[10, 20, 30, 50].map((g) => (
              <button
                key={g}
                onClick={() => api.setGoal(g).then(setMe)}
                className={`rounded-xl border-2 px-3 py-1.5 text-sm font-extrabold ${
                  me?.daily_goal === g
                    ? "border-macaw bg-sky-50 text-macaw dark:bg-night-card"
                    : "border-swan text-wolf dark:border-night-border dark:text-hare"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </Row>
        <Row>
          <div>
            <p className="font-extrabold">Dark mode</p>
            <p className="text-sm text-wolf dark:text-hare">Easier on night-owl eyes</p>
          </div>
          <button
            role="switch"
            aria-checked={dark}
            onClick={toggleDark}
            className={`h-8 w-14 rounded-full p-1 transition-colors ${dark ? "bg-feather" : "bg-swan"}`}
          >
            <span
              className={`block h-6 w-6 rounded-full bg-white transition-transform ${dark ? "translate-x-6" : ""}`}
            />
          </button>
        </Row>
        <Row>
          <p className="font-extrabold">Sound effects</p>
          <span className="text-sm font-bold text-hare">Coming soon</span>
        </Row>
        <Row>
          <p className="font-extrabold">Notifications</p>
          <span className="text-sm font-bold text-hare">Coming soon</span>
        </Row>
        <Row>
          <p className="font-extrabold">Account &amp; privacy</p>
          <span className="text-sm font-bold text-hare">Coming soon</span>
        </Row>
      </div>

      <h2 className="mb-1 text-lg font-extrabold text-wolf dark:text-hare">Demo tools</h2>
      <p className="mb-3 text-sm text-wolf dark:text-hare">
        The streak and heart-regen rules are date-based; these buttons move the app&apos;s simulated
        clock so you can test them without waiting a day.
      </p>
      <div className="rounded-2xl border-2 border-swan px-5 dark:border-night-border">
        <Row>
          <div>
            <p className="font-extrabold">Simulate next day</p>
            <p className="text-sm text-wolf dark:text-hare">
              Do a lesson after this to see your streak extend (or break after 2+ days)
            </p>
          </div>
          <button
            className="btn btn-blue !h-10 text-xs"
            onClick={() => api.advanceDay(1).then((m) => (setMe(m), toast("⏭️ Jumped one day ahead")))}
          >
            +1 day
          </button>
        </Row>
        <Row>
          <div>
            <p className="font-extrabold">Reset my progress</p>
            <p className="text-sm text-wolf dark:text-hare">Back to a fresh learner</p>
          </div>
          <button
            className="btn btn-red !h-10 text-xs"
            onClick={() =>
              confirm("Reset all progress?") &&
              api.resetProgress().then((m) => (setMe(m), refresh(), toast("Progress reset")))
            }
          >
            Reset
          </button>
        </Row>
      </div>

      <p className="mt-8 text-center text-sm font-bold text-hare">
        Duolingo Web App Clone · built for the SDE Fullstack assignment
      </p>
    </div>
  );
}
