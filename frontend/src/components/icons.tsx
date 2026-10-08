/** Hand-drawn SVG icon set (original work, Duolingo-flavoured shapes). */

export function FlameIcon({ className = "w-6 h-6", lit = true }: { className?: string; lit?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 2c.6 3.2-1.3 4.8-2.9 6.6C7.4 10.5 6 12.4 6 15a6 6 0 0 0 12 0c0-2.1-.9-3.7-2-5.2-.4 1-1 1.8-2 2.4.3-3.5-.7-7.4-2-10.2z"
        fill={lit ? "#FF9600" : "#AFAFAF"}
      />
      <path
        d="M12 21.5A4.5 4.5 0 0 1 7.5 17c0-1.8 1-3.1 2.2-4.3.7-.7 1.5-1.4 2-2.4 1.6 1.8 2.8 4 2.8 6.7 0 2.5-1 4.5-2.5 4.5z"
        fill={lit ? "#FFC800" : "#CECECE"}
      />
    </svg>
  );
}

export function GemIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 2 4 8l8 14 8-14-8-6z" fill="#1CB0F6" />
      <path d="M12 2 8 8h8l-4-6zM4 8l8 14-4-14H4zm12 0-4 14 8-14h-4z" fill="#84D8FF" opacity="0.7" />
    </svg>
  );
}

export function HeartIcon({ className = "w-6 h-6", empty = false }: { className?: string; empty?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 21s-7.5-4.8-9.8-9C.6 9 1.7 5.6 4.8 4.6c2-.6 4.2 0 5.6 1.6l1.6 1.7 1.6-1.7c1.4-1.6 3.6-2.2 5.6-1.6 3.1 1 4.2 4.4 2.6 7.4-2.3 4.2-9.8 9-9.8 9z"
        fill={empty ? "#E5E5E5" : "#FF4B4B"}
      />
    </svg>
  );
}

export function BoltIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" fill="#FFC800" stroke="#E6A700" strokeWidth="1" />
    </svg>
  );
}

export function CrownIcon({ className = "w-6 h-6", gold = true }: { className?: string; gold?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M3 8l4 3 5-6 5 6 4-3-1.5 10h-15L3 8z"
        fill={gold ? "#FFC800" : "#E5E5E5"}
        stroke={gold ? "#E6A700" : "#CECECE"}
        strokeWidth="1.2"
      />
      <circle cx="12" cy="13.5" r="1.8" fill={gold ? "#FF9600" : "#AFAFAF"} />
    </svg>
  );
}

export function CheckIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M4 12.5 10 18 20 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LockIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="5" y="10" width="14" height="10" rx="2.5" fill="currentColor" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

export function SpeakerIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
      <path
        d="M16 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const PATH_ICON_PATHS: Record<string, string> = {
  star: "M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17l-6.1 3.6 1.4-6.8L2.2 9.1l6.9-.8L12 2z",
  book: "M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2V5zm9-2h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5V3z",
  wave: "M7 11V5.5a1.5 1.5 0 0 1 3 0V11m0-4.5v-2a1.5 1.5 0 0 1 3 0V11m0-6a1.5 1.5 0 0 1 3 0v8.5a6 6 0 0 1-12 0V8a1.5 1.5 0 0 1 3 0",
  plane: "M21 4 3 11l7 2 2 7 3-5 5 1-1-12z",
  apple: "M12 7c2-3 6-2.5 7 1 1 4-2 10-5 11-1 .4-3 .4-4 0-3-1-6-7-5-11 1-3.5 5-4 7-1zm0 0c0-2 1-3.5 3-4",
  family: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 20c0-3 2.2-5 5-5s5 2 5 5H3zm11 0c0-2.4 1.8-4 3.9-4 2.2 0 4.1 1.6 4.1 4h-8z",
  paw: "M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM4.5 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm15 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 12c2.8 0 5.5 2.2 5.5 5 0 1.7-1.3 3-3 3-.9 0-1.7-.5-2.5-.5s-1.6.5-2.5.5c-1.7 0-3-1.3-3-3 0-2.8 2.7-5 5.5-5z",
  palette: "M12 3a9 9 0 0 0 0 18c1.5 0 2-1 1.5-2-.6-1.3 0-2.5 1.5-2.5h2A4 4 0 0 0 21 12.5C21 7 17 3 12 3zM7.5 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z",
  chat: "M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z",
  fork: "M7 2v8a2 2 0 0 0 2 2v10h2V12a2 2 0 0 0 2-2V2h-2v6H9V2H7zm10 0c-1.7 0-3 2-3 5v6h2v9h2V2h-1z",
  pin: "M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z",
  clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 10.4 4 2.3-1 1.7-5-2.9V6h2v6.4z",
  trophy: "M7 3h10v2h4s0 6-5 7c-.8 1.5-2 2.4-3 2.8V18h3l1 3H7l1-3h3v-3.2c-1-.4-2.2-1.3-3-2.8-5-1-5-7-5-7h4V3z",
};

export function PathIcon({ icon, className = "w-8 h-8 text-white" }: { icon: string; className?: string }) {
  const d = PATH_ICON_PATHS[icon] ?? PATH_ICON_PATHS.star;
  const stroked = icon === "wave" || icon === "apple";
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d={d}
        fill={stroked ? "none" : "currentColor"}
        stroke="currentColor"
        strokeWidth={stroked ? 2 : 0}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The mascot: an original cartoon owl in the Duolingo spirit. */
export function Owl({ className = "w-28 h-28", mood = "happy" }: { className?: string; mood?: "happy" | "sad" | "cheer" }) {
  const browY = mood === "sad" ? 2 : 0;
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      {/* wings */}
      <ellipse cx="18" cy="72" rx="12" ry="20" fill="#43A302" transform={mood === "cheer" ? "rotate(-40 18 72)" : ""} />
      <ellipse cx="102" cy="72" rx="12" ry="20" fill="#43A302" transform={mood === "cheer" ? "rotate(40 102 72)" : ""} />
      {/* body */}
      <ellipse cx="60" cy="68" rx="42" ry="46" fill="#58CC02" />
      <ellipse cx="60" cy="80" rx="26" ry="28" fill="#89E219" />
      {/* feet */}
      <ellipse cx="46" cy="113" rx="9" ry="5" fill="#FF9600" />
      <ellipse cx="74" cy="113" rx="9" ry="5" fill="#FF9600" />
      {/* eyes */}
      <g>
        <ellipse cx="44" cy="52" rx="16" ry="19" fill="#FFFFFF" />
        <ellipse cx="76" cy="52" rx="16" ry="19" fill="#FFFFFF" />
        <circle cx="48" cy={54 + browY} r="6.5" fill="#4B4B4B" />
        <circle cx="72" cy={54 + browY} r="6.5" fill="#4B4B4B" />
        <circle cx="50" cy={52 + browY} r="2.2" fill="#FFFFFF" />
        <circle cx="74" cy={52 + browY} r="2.2" fill="#FFFFFF" />
      </g>
      {/* beak */}
      <path d="M52 66c2-5 14-5 16 0 1.5 4-3 8-8 8s-9.5-4-8-8z" fill="#FF9600" />
      <path d="M54 70h12c-1 3-3.5 4.5-6 4.5S55 73 54 70z" fill="#FFC200" />
      {mood === "sad" && (
        <>
          <path d="M34 38q10-6 18 2" stroke="#43A302" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M86 38q-10-6-18 2" stroke="#43A302" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
