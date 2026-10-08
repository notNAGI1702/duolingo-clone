"use client";

/** The home learning path: units, zig-zag skill nodes, crowns and locks. */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, type Path, type SkillNode } from "@/lib/api";
import { useUser } from "@/components/UserContext";
import { CheckIcon, CrownIcon, LockIcon, Owl, PathIcon } from "@/components/icons";

const OFFSETS = [0, -45, -70, -45, 0, 45, 70, 45]; // the serpentine wobble

function Ring({ done, total, color }: { done: number; total: number; color: string }) {
  const R = 46;
  const C = 2 * Math.PI * R;
  const pct = total ? done / total : 0;
  return (
    <svg viewBox="0 0 104 104" className="pointer-events-none absolute -inset-[13px] h-[104px] w-[104px] -rotate-90">
      <circle cx="52" cy="52" r={R} fill="none" strokeWidth="8" className="stroke-swan dark:stroke-night-border" />
      <circle
        cx="52"
        cy="52"
        r={R}
        fill="none"
        strokeWidth="8"
        strokeLinecap="round"
        stroke={color}
        strokeDasharray={C}
        strokeDashoffset={C * (1 - pct)}
        className="transition-all duration-700"
      />
    </svg>
  );
}

function Node({
  skill,
  unitColor,
  isActive,
  open,
  onToggle,
}: {
  skill: SkillNode;
  unitColor: string;
  isActive: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const locked = skill.status === "locked";
  const complete = skill.status === "complete" || skill.status === "legendary";
  const bg = locked ? "#E5E5E5" : complete ? "#FFC800" : unitColor;
  const lip = locked ? "#CECECE" : complete ? "#E6A700" : "rgba(0,0,0,0.25)";

  return (
    <div
      className="relative flex flex-col items-center"
      style={{
        transform: `translateX(${OFFSETS[skill.position % OFFSETS.length]}px)`,
        zIndex: open ? 40 : undefined, // keep the popover above later nodes
      }}
    >
      {isActive && (
        <div className="absolute -top-9 z-10 animate-bounce2 rounded-xl border-2 border-swan bg-snow px-3 py-1 text-sm font-extrabold uppercase tracking-wide text-feather shadow dark:border-night-border dark:bg-night-card">
          Start
          <div className="absolute left-1/2 top-full -ml-2 h-0 w-0 border-8 border-transparent border-t-swan" />
        </div>
      )}
      <div className="relative">
        {isActive && <Ring done={skill.lessons_done} total={skill.total_lessons} color={unitColor} />}
        <button
          aria-label={skill.title}
          onClick={onToggle}
          className="relative z-[1] flex h-[78px] w-[78px] items-center justify-center rounded-full transition-transform active:translate-y-1"
          style={{ background: bg, boxShadow: `0 8px 0 0 ${lip}` }}
        >
          {locked ? (
            <LockIcon className="h-8 w-8 text-[#AFAFAF]" />
          ) : complete ? (
            <CheckIcon className="h-9 w-9 text-white" />
          ) : (
            <PathIcon icon={skill.icon} className="h-9 w-9 text-white" />
          )}
        </button>
        {!locked && skill.crowns > 0 && (
          <span className="absolute -right-2 -top-1 z-[2] flex items-center gap-0.5 rounded-full border-2 border-swan bg-snow px-1.5 py-0.5 text-xs font-extrabold text-fox dark:border-night-border dark:bg-night-card">
            <CrownIcon className="h-4 w-4" /> {skill.crowns}
          </span>
        )}
      </div>
      <p className={`mt-2 text-sm font-extrabold ${locked ? "text-hare" : ""}`}>{skill.title}</p>

      {open && (
        <div
          className="absolute top-[118px] z-30 w-72 animate-pop rounded-2xl p-5 text-white shadow-xl"
          style={{ background: locked ? "#AFAFAF" : unitColor }}
        >
          <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45" style={{ background: locked ? "#AFAFAF" : unitColor }} />
          <h4 className="mb-1 text-lg font-extrabold">{skill.title}</h4>
          {locked ? (
            <>
              <p className="mb-4 text-sm opacity-90">
                Complete all levels above to unlock this!
              </p>
              <button className="btn w-full bg-white/30 text-white border-black/10" disabled>
                Locked
              </button>
            </>
          ) : (
            <>
              <p className="mb-4 text-sm opacity-90">
                {skill.status === "complete" || skill.status === "legendary"
                  ? `Crown level ${skill.crowns}/${skill.max_crowns} — practice to level up!`
                  : `Lesson ${skill.lessons_done + 1} of ${skill.total_lessons}`}
              </p>
              <Link
                href={`/lesson/${skill.next_lesson_id}`}
                className="btn w-full bg-snow text-eel border-black/20"
              >
                {skill.crowns > 0 ? `Start +${skill.lessons[0]?.xp_reward ?? 10} XP` : "Start"}
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function LearnPage() {
  const { me } = useUser();
  const [path, setPath] = useState<Path | null>(null);
  const [openSkill, setOpenSkill] = useState<number | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    api.path().then(setPath).catch(() => {});
    loaded.current = true;
  }, [me?.total_xp]);

  if (!path) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Owl className="h-24 w-24 animate-bounce2" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[520px] px-4" onClick={() => openSkill != null && setOpenSkill(null)}>
      {path.units.map((unit, ui) => (
        <section key={unit.id} className="mb-10">
          <div
            className="sticky top-14 z-20 mb-10 flex items-center justify-between rounded-2xl p-5 text-white shadow-lip sm:top-2"
            style={{ background: unit.unlocked ? unit.color : "#AFAFAF", ["--tw-shadow-color" as string]: "rgba(0,0,0,0.2)" }}
          >
            <div>
              <p className="text-sm font-bold uppercase opacity-80">
                {unit.title}
              </p>
              <h2 className="text-xl font-extrabold">{unit.description}</h2>
            </div>
            <button
              className="rounded-xl border-2 border-white/40 p-2 text-2xl"
              title="Guidebook (coming soon)"
            >
              📓
            </button>
          </div>

          <div className="relative flex flex-col items-center gap-9">
            {ui === 0 && (
              <Owl className="pointer-events-none absolute -right-2 top-20 hidden h-28 w-28 sm:block" />
            )}
            {unit.skills.map((skill) => (
              <div key={skill.id} onClick={(e) => e.stopPropagation()}>
                <Node
                  skill={skill}
                  unitColor={unit.color}
                  isActive={skill.id === path.active_skill_id}
                  open={openSkill === skill.id}
                  onToggle={() => setOpenSkill(openSkill === skill.id ? null : skill.id)}
                />
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="mb-16 flex flex-col items-center gap-2">
        <div
          className="flex h-[78px] w-[78px] items-center justify-center rounded-full bg-swan dark:bg-night-border"
          style={{ boxShadow: "0 8px 0 0 #CECECE" }}
          title="Course trophy — finish every skill!"
        >
          <span className="text-4xl">🏆</span>
        </div>
        <p className="text-sm font-extrabold text-hare">Course complete</p>
      </div>
    </div>
  );
}
