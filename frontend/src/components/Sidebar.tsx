"use client";

/** Desktop left nav + mobile bottom tab bar, like the real app. */

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/learn", label: "Learn", emoji: "🏠" },
  { href: "/leaderboard", label: "Leaderboards", emoji: "🛡️" },
  { href: "/quests", label: "Quests", emoji: "🎯" },
  { href: "/shop", label: "Shop", emoji: "🛒" },
  { href: "/profile", label: "Profile", emoji: "🙂" },
  { href: "/settings", label: "More", emoji: "⚙️" },
];

function NavLink({
  href,
  label,
  emoji,
  active,
  compact,
}: {
  href: string;
  label: string;
  emoji: string;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 rounded-xl px-4 py-2.5 font-bold uppercase tracking-wide transition-colors ${
        active
          ? "border-2 border-macaw/40 bg-sky-50 text-macaw dark:bg-night-card"
          : "border-2 border-transparent text-wolf hover:bg-polar dark:text-hare dark:hover:bg-night-card"
      } ${compact ? "justify-center px-2" : ""}`}
    >
      <span className="text-2xl leading-none">{emoji}</span>
      {!compact && <span className="text-sm">{label}</span>}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <>
      {/* desktop / tablet */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-1 border-r-2 border-swan p-4 dark:border-night-border sm:flex lg:w-64 sm:w-20">
        <Link href="/learn" className="mb-5 px-3 pt-3">
          <span className="hidden text-3xl font-extrabold lowercase tracking-tight text-feather lg:block">
            duolingo
          </span>
          <span className="block text-3xl lg:hidden">🦉</span>
        </Link>
        {ITEMS.map((it) => (
          <div key={it.href}>
            <div className="hidden lg:block">
              <NavLink {...it} active={pathname.startsWith(it.href)} />
            </div>
            <div className="lg:hidden">
              <NavLink {...it} active={pathname.startsWith(it.href)} compact />
            </div>
          </div>
        ))}
      </aside>

      {/* mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t-2 border-swan bg-snow py-2 dark:border-night-border dark:bg-night-bg sm:hidden">
        {ITEMS.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            aria-label={it.label}
            className={`rounded-xl p-2 text-2xl ${
              pathname.startsWith(it.href) ? "border-2 border-macaw/40 bg-sky-50 dark:bg-night-card" : ""
            }`}
          >
            {it.emoji}
          </Link>
        ))}
      </nav>
    </>
  );
}
