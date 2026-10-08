"use client";

import Sidebar from "@/components/Sidebar";
import RightRail from "@/components/RightRail";
import StatBar from "@/components/StatBar";
import { useUser } from "@/components/UserContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { error } = useUser();
  return (
    <div className="mx-auto flex min-h-screen max-w-[1200px]">
      <Sidebar />
      <main className="min-w-0 flex-1 pb-24 sm:pb-8">
        <StatBar />
        {error && (
          <div className="mx-4 mt-4 rounded-2xl border-2 border-cardinal bg-red-50 p-4 text-sm font-bold text-cardinal dark:bg-night-card">
            Can&apos;t reach the backend ({error}). Start it with{" "}
            <code className="font-mono">uvicorn app.main:app --reload</code> and seed with{" "}
            <code className="font-mono">python -m app.seed</code>.
          </div>
        )}
        {children}
      </main>
      <RightRail />
    </div>
  );
}
