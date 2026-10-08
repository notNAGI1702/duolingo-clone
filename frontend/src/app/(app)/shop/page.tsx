"use client";

/** Shop: working heart refill (gems are mocked currency), Super placeholder. */

import Link from "next/link";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useUser } from "@/components/UserContext";
import { GemIcon, HeartIcon } from "@/components/icons";

export default function ShopPage() {
  const { me, setMe } = useUser();
  const [msg, setMsg] = useState<string | null>(null);

  const refill = async () => {
    try {
      setMe(await api.refillHearts());
      setMsg("❤️ Hearts refilled!");
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Something went wrong");
    }
    setTimeout(() => setMsg(null), 2500);
  };

  const full = (me?.hearts ?? 0) >= (me?.max_hearts ?? 5);

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-extrabold">Shop</h1>

      {msg && (
        <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 animate-pop rounded-2xl bg-eel px-6 py-3 font-bold text-white shadow-xl">
          {msg}
        </div>
      )}

      <h2 className="mb-3 text-lg font-extrabold text-wolf dark:text-hare">Hearts</h2>
      <div className="mb-8 flex items-center gap-4 rounded-2xl border-2 border-swan p-5 dark:border-night-border">
        <HeartIcon className="h-12 w-12" />
        <div className="flex-1">
          <p className="font-extrabold">Refill Hearts</p>
          <p className="text-sm text-wolf dark:text-hare">
            Get back to full hearts so you can keep learning.
          </p>
        </div>
        <button className="btn btn-green shrink-0 gap-2 text-sm" disabled={full} onClick={refill}>
          {full ? "Full" : (
            <>
              <GemIcon className="h-5 w-5" /> 350
            </>
          )}
        </button>
      </div>

      <div className="mb-8 flex items-center gap-4 rounded-2xl border-2 border-swan p-5 dark:border-night-border">
        <span className="text-5xl">🏋️</span>
        <div className="flex-1">
          <p className="font-extrabold">Practice to earn hearts</p>
          <p className="text-sm text-wolf dark:text-hare">
            Review a lesson you&apos;ve completed and earn one heart back. Free!
          </p>
        </div>
        <Link href="/lesson/practice" className="btn btn-blue shrink-0 text-sm">
          Practice
        </Link>
      </div>

      <h2 className="mb-3 text-lg font-extrabold text-wolf dark:text-hare">Super</h2>
      <div className="rounded-2xl bg-gradient-to-r from-humpback to-beetle p-6 text-white">
        <h3 className="mb-1 text-xl font-extrabold">Super Duolingo</h3>
        <p className="mb-4 font-bold opacity-90">
          Unlimited hearts, no ads, legendary challenges and more.
        </p>
        <button className="btn w-full border-black/20 bg-white text-humpback" disabled>
          Coming soon
        </button>
      </div>
    </div>
  );
}
