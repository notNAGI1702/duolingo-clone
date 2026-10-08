"use client";

/** One component per exercise kind. Each reports its current answer upward;
 *  grading itself happens on the server. */

import { useEffect, useMemo, useState } from "react";
import type { Exercise } from "@/lib/api";
import { speak } from "@/lib/audio";
import { SpeakerIcon } from "@/components/icons";

export type AnswerValue = Record<string, unknown> | null;

interface ExProps {
  exercise: Exercise;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  locked: boolean; // after checking, freeze input
}

export function SpeakButton({ text, big = false }: { text: string; big?: boolean }) {
  return (
    <button
      type="button"
      aria-label="Play audio"
      onClick={() => speak(text)}
      className={`btn btn-blue !h-auto shrink-0 ${big ? "p-4" : "p-2"}`}
    >
      <SpeakerIcon className={big ? "h-7 w-7" : "h-5 w-5"} />
    </button>
  );
}

// ------------------------------------------------------------- multiple choice

export function MultipleChoice({ exercise, value, onChange, locked }: ExProps) {
  const options = (exercise.payload.options ?? []) as { id: number; text: string; emoji?: string }[];
  const chosen = value?.option_id as number | undefined;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {options.map((o, i) => (
        <button
          key={o.id}
          type="button"
          disabled={locked}
          onClick={() => {
            onChange({ option_id: o.id });
            speak(o.text);
          }}
          className={`tile flex min-h-[130px] flex-col items-center justify-center gap-2 p-4 text-center ${
            chosen === o.id ? "tile-selected" : ""
          }`}
        >
          <span className="text-5xl">{o.emoji ?? "🔤"}</span>
          <span>{o.text}</span>
          <span className={`text-xs ${chosen === o.id ? "text-macaw" : "text-hare"}`}>{i + 1}</span>
        </button>
      ))}
    </div>
  );
}

// ------------------------------------------------------- translate (word bank)

export function Translate({ exercise, value, onChange, locked }: ExProps) {
  const bank = useMemo(() => exercise.payload.bank ?? [], [exercise]);
  const picked = (value?.words as string[] | undefined) ?? [];
  // bank entries may repeat, so track picked indices, not strings
  const [pickedIdx, setPickedIdx] = useState<number[]>([]);

  useEffect(() => {
    setPickedIdx([]);
  }, [exercise.id]);

  const toggle = (idx: number) => {
    if (locked) return;
    const next = pickedIdx.includes(idx)
      ? pickedIdx.filter((n) => n !== idx)
      : [...pickedIdx, idx];
    setPickedIdx(next);
    onChange(next.length ? { words: next.map((n) => bank[n]) } : null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        {exercise.audio_text && <SpeakButton text={exercise.audio_text} big />}
        <p className="text-xl font-bold">{exercise.payload.source}</p>
      </div>

      {/* answer strip */}
      <div className="mb-8 flex min-h-[58px] flex-wrap items-start gap-2 border-y-2 border-swan py-2 dark:border-night-border">
        {pickedIdx.map((idx) => (
          <button key={idx} type="button" className="tile animate-pop" onClick={() => toggle(idx)}>
            {bank[idx]}
          </button>
        ))}
      </div>

      {/* word bank */}
      <div className="flex flex-wrap justify-center gap-2">
        {bank.map((w, idx) =>
          pickedIdx.includes(idx) ? (
            <span key={idx} className="tile tile-ghost">
              {w}
            </span>
          ) : (
            <button key={idx} type="button" className="tile" onClick={() => toggle(idx)}>
              {w}
            </button>
          )
        )}
      </div>
      {picked.length === 0 && <span className="sr-only">Pick words to build the sentence</span>}
    </div>
  );
}

// ------------------------------------------------------------------ match pairs

export function MatchPairs({
  exercise,
  onSolved,
  locked,
}: {
  exercise: Exercise;
  onSolved: () => void;
  locked: boolean;
}) {
  const pairs = useMemo(() => exercise.payload.pairs ?? [], [exercise]);
  const left = useMemo(() => pairs.map((p) => p.a), [pairs]);
  const right = useMemo(
    () => [...pairs.map((p) => p.b)].sort(() => 0.5 - Math.random()),
    [pairs]
  );
  const [sel, setSel] = useState<{ side: "a" | "b"; text: string } | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [miss, setMiss] = useState<string | null>(null);

  useEffect(() => {
    setSel(null);
    setDone(new Set());
  }, [exercise.id]);

  const tap = (side: "a" | "b", text: string) => {
    if (locked || done.has(text)) return;
    if (side === "b") speak(text);
    if (!sel || sel.side === side) {
      setSel({ side, text });
      return;
    }
    const a = side === "a" ? text : sel.text;
    const b = side === "b" ? text : sel.text;
    const hit = pairs.some((p) => p.a === a && p.b === b);
    if (hit) {
      const next = new Set(done);
      next.add(a);
      next.add(b);
      setDone(next);
      setSel(null);
      if (next.size === pairs.length * 2) onSolved();
    } else {
      setMiss(text + sel.text);
      setSel(null);
      setTimeout(() => setMiss(null), 400);
    }
  };

  const cls = (side: "a" | "b", text: string) => {
    if (done.has(text)) return "tile tile-correct opacity-60";
    if (sel?.side === side && sel.text === text) return "tile tile-selected";
    if (miss?.includes(text)) return "tile tile-wrong animate-shake";
    return "tile";
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-3">
        {left.map((t) => (
          <button key={t} type="button" className={`${cls("a", t)} py-4`} onClick={() => tap("a", t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {right.map((t) => (
          <button key={t} type="button" className={`${cls("b", t)} py-4`} onClick={() => tap("b", t)}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- fill blank

export function FillBlank({ exercise, value, onChange, locked }: ExProps) {
  const chosen = value?.text as string | undefined;
  const options = (exercise.payload.options ?? []) as string[];
  return (
    <div>
      <p className="mb-2 text-sm font-bold uppercase text-wolf dark:text-hare">
        {exercise.payload.hint}
      </p>
      <p className="mb-8 text-2xl font-bold leading-relaxed">
        {exercise.payload.before}{" "}
        <span className="mx-1 inline-block min-w-[90px] border-b-4 border-swan text-center text-macaw dark:border-night-border">
          {chosen ?? " "}
        </span>{" "}
        {exercise.payload.after}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            disabled={locked}
            className={`tile px-6 py-3 ${chosen === o ? "tile-selected" : ""}`}
            onClick={() => onChange({ text: o })}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- type answer

export function TypeAnswer({ exercise, value, onChange, locked }: ExProps) {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        {exercise.audio_text && <SpeakButton text={exercise.audio_text} />}
        <p className="rounded-2xl border-2 border-swan p-4 text-xl font-bold dark:border-night-border">
          {exercise.payload.source}
        </p>
      </div>
      <textarea
        value={(value?.text as string | undefined) ?? ""}
        onChange={(e) => onChange(e.target.value ? { text: e.target.value } : null)}
        disabled={locked}
        placeholder="Type in Spanish"
        rows={3}
        className="w-full resize-none rounded-2xl border-2 border-swan bg-polar p-4 text-lg font-bold outline-none focus:border-macaw dark:border-night-border dark:bg-night-card"
      />
    </div>
  );
}
