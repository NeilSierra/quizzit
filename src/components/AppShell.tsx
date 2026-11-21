"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MotionConfig } from "framer-motion";
import {
  BookOpen,
  History,
  Home,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
  Upload,
} from "lucide-react";
import { sound } from "@/lib/sound";
import { useLibrary } from "@/store/useLibrary";
import { useQuizSession } from "@/store/useQuizSession";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Preferences", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hydrate = useLibrary((s) => s.hydrate);
  const theme = useLibrary((s) => s.theme);
  const setTheme = useLibrary((s) => s.setTheme);
  const checkSavedSession = useQuizSession((s) => s.checkSavedSession);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    hydrate();
    checkSavedSession();
    try {
      if (localStorage.getItem("quizapp:sidebar-collapsed") === "true") {
        setCollapsed(true);
      }
    } catch {
      // ignore
    }
  }, [hydrate, checkSavedSession]);

  const toggleSidebar = () => {
    sound.playClick();
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("quizapp:sidebar-collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const isPlayRoute = /^\/quiz\/[^/]+\/play/.test(pathname);

  const cycleTheme = () => {
    sound.playClick();
    const next =
      theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
  };

  if (isPlayRoute) {
    return (
      <MotionConfig reducedMotion="user">
        <main className="min-h-screen bg-bg">{children}</main>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh flex flex-col md:flex-row bg-bg overflow-x-clip">
      {/* Desktop Sidebar (switchable 256px / 80px) */}
      <aside
        className={`hidden md:flex md:shrink-0 md:flex-col border-r-2 border-border bg-bg-subtle p-3 sticky top-0 h-screen transition-[width] duration-200 ${
          collapsed ? "md:w-20 items-center" : "md:w-64 p-4"
        }`}
      >
        <div
          className={`mb-6 flex w-full items-center ${
            collapsed ? "flex-col gap-3" : "justify-between gap-2"
          }`}
        >
          <Link
            href="/"
            onClick={() => sound.playClick()}
            title="Quizzit Home"
            className={`focus-ring flex items-center gap-3 rounded-2xl ${
              collapsed ? "p-1" : "px-2 py-1.5"
            }`}
          >
            <img
              src="/mascot/logo.png"
              alt="Quizzit mascot"
              className="h-10 w-10 shrink-0 object-contain"
            />
            {!collapsed && (
              <span className="text-2xl font-extrabold tracking-tight text-brand-text">
                Quizzit
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-transparent text-text-muted hover:border-border hover:bg-surface hover:text-text transition-colors"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>

        <nav
          aria-label="Main navigation"
          className="flex flex-col gap-2 flex-1 w-full"
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                onClick={() => sound.playClick()}
                className={`focus-ring flex min-h-[52px] items-center rounded-2xl border-2 font-extrabold text-sm uppercase tracking-wider transition-colors ${
                  collapsed ? "justify-center px-0" : "gap-3 px-4"
                } ${
                  active
                    ? "border-brand-fill bg-brand-tint text-brand-text"
                    : "border-transparent text-text-muted hover:bg-surface hover:text-text"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={2.25} />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Theme Footer */}
        <div className="mt-auto flex w-full flex-col gap-3 pt-4 border-t-2 border-border">
          <button
            type="button"
            onClick={cycleTheme}
            title={`Theme: ${theme}`}
            aria-label={`Theme: ${theme}`}
            className={`focus-ring flex min-h-11 w-full items-center rounded-xl border-2 border-border bg-surface text-sm font-bold text-text-muted hover:border-border-strong hover:text-text ${
              collapsed ? "justify-center px-0" : "justify-between px-3"
            }`}
          >
            <span className="flex items-center gap-2">
              {theme === "dark" ? (
                <Moon className="h-4 w-4 shrink-0" />
              ) : (
                <Sun className="h-4 w-4 shrink-0" />
              )}
              {!collapsed && <span>Theme</span>}
            </span>
            {!collapsed && (
              <span className="uppercase text-xs font-extrabold text-brand-text">
                {theme}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="flex md:hidden items-center justify-between border-b-2 border-border bg-surface px-4 py-3 sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/mascot/logo.png"
            alt="Quizzit mascot"
            className="h-9 w-9 shrink-0 object-contain"
          />
          <span className="text-xl font-extrabold text-brand-text">Quizzit</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cycleTheme}
            aria-label={`Theme: ${theme}`}
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl border-2 border-border bg-bg-subtle text-text-muted"
          >
            {theme === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pb-24 md:pb-12 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mx-auto max-w-[860px]">{children}</div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 inset-x-0 z-30 flex md:hidden items-center justify-around border-t-2 border-border bg-surface px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))]"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => sound.playClick()}
              className={`focus-ring flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide ${
                active
                  ? "bg-brand-tint text-brand-text"
                  : "text-text-muted"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      </div>
    </MotionConfig>
  );
}
