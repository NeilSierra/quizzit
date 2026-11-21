"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import {
  BookOpen,
  HelpCircle,
  History,
  Home,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
  Upload,
  UserCheck,
  UserCircle,
  WifiOff,
  X,
} from "lucide-react";
import { AuthModal } from "@/components/auth/AuthModal";
import { GuestMergeModal } from "@/components/auth/GuestMergeModal";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { APP_VERSION, PATCH_NOTES } from "@/lib/changelog";
import { sound } from "@/lib/sound";
import { getUserDisplayName, useAuth } from "@/store/useAuth";
import { useLibrary } from "@/store/useLibrary";
import { useQuizSession } from "@/store/useQuizSession";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hydrate = useLibrary((s) => s.hydrate);
  const theme = useLibrary((s) => s.theme);
  const setTheme = useLibrary((s) => s.setTheme);
  const checkSavedSession = useQuizSession((s) => s.checkSavedSession);
  const initAuth = useAuth((s) => s.initAuth);
  const user = useAuth((s) => s.user);
  const openAuthModal = useAuth((s) => s.openAuthModal);
  const [collapsed, setCollapsed] = useState(false);
  const [showPatchNotes, setShowPatchNotes] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncOnline = () => setIsOffline(!navigator.onLine);
    syncOnline();
    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);
    return () => {
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
    };
  }, []);

  useEffect(() => {
    hydrate();
    initAuth();
    checkSavedSession();
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
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
        <AuthModal />
      <GuestMergeModal />
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
            className={`focus-ring flex items-center gap-2.5 rounded-2xl ${
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
          <Link
            href="/help"
            onClick={() => sound.playClick()}
            title="Help & Quiz Guide"
            className={`focus-ring flex min-h-[52px] items-center rounded-2xl border-2 font-extrabold text-sm uppercase tracking-wider transition-colors ${
              collapsed ? "justify-center px-0" : "gap-3 px-4"
            } ${
              pathname.startsWith("/help")
                ? "border-brand-fill bg-brand-tint text-brand-text"
                : "border-transparent text-text-muted hover:bg-surface hover:text-text"
            }`}
          >
            <HelpCircle className="h-5 w-5 shrink-0" strokeWidth={2.25} />
            {!collapsed && <span>Help</span>}
          </Link>
        </nav>

        {/* Theme Footer */}
        <div className="mt-auto flex w-full flex-col gap-2 pt-4 border-t-2 border-border">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              openAuthModal();
            }}
            title={user ? getUserDisplayName(user) : "Sign in to sync"}
            className={`focus-ring flex min-h-11 w-full items-center rounded-xl border-2 border-border bg-surface text-sm font-bold text-text-muted hover:border-border-strong hover:text-text ${
              collapsed ? "justify-center px-0" : "justify-between px-3"
            }`}
          >
            <span className="flex items-center gap-2 min-w-0">
              {user ? (
                <UserCheck className="h-4 w-4 shrink-0 text-success" />
              ) : (
                <UserCircle className="h-4 w-4 shrink-0" />
              )}
              {!collapsed && (
                <span className="truncate">
                  {user ? getUserDisplayName(user) : "Account"}
                </span>
              )}
            </span>
            {!collapsed && !user && (
              <span className="uppercase text-xs font-extrabold text-brand-text shrink-0">
                Sign In
              </span>
            )}
          </button>

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

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowPatchNotes(true);
            }}
            title="View patch notes"
            className={`focus-ring flex min-h-11 w-full items-center rounded-xl border-2 border-border bg-surface text-sm font-bold text-text-muted hover:border-border-strong hover:text-text ${
              collapsed ? "justify-center px-0" : "justify-between px-3"
            }`}
          >
            {!collapsed && <span>Patch Notes</span>}
            <span className="uppercase text-xs font-extrabold text-brand-text">
              {APP_VERSION}
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden border-b-2 border-border bg-surface sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/"
            onClick={() => sound.playClick()}
            className="flex items-center gap-2.5"
          >
            <img
              src="/mascot/logo.png"
              alt="Quizzit mascot"
              className="h-9 w-9 shrink-0 object-contain"
            />
            <span className="text-xl font-extrabold text-brand-text">
              Quizzit
            </span>
          </Link>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setMobileMenuOpen((v) => !v);
            }}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl border-2 border-border bg-bg-subtle text-text hover:border-border-strong"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                aria-hidden="true"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.14, ease: "easeOut" }}
                className="absolute right-4 top-full mt-2 z-40 w-64 rounded-2xl border-2 border-border bg-surface-raised p-2 shadow-xl"
              >
                <div className="flex flex-col gap-1.5">
                <Link
                  href="/help"
                  onClick={() => {
                    sound.playClick();
                    setMobileMenuOpen(false);
                  }}
                  className="focus-ring flex min-h-12 items-center gap-3 rounded-xl border-2 border-border bg-surface px-3.5 text-sm font-extrabold text-text"
                >
                  <HelpCircle className="h-5 w-5 text-brand-text shrink-0" />
                  <span>Help &amp; Quiz Guide</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setMobileMenuOpen(false);
                    openAuthModal();
                  }}
                  className="focus-ring flex min-h-12 w-full items-center justify-between rounded-xl border-2 border-border bg-surface px-3.5 text-sm font-extrabold text-text"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    {user ? (
                      <UserCheck className="h-5 w-5 shrink-0 text-success" />
                    ) : (
                      <UserCircle className="h-5 w-5 shrink-0 text-brand-text" />
                    )}
                    <span className="truncate">
                      {user ? getUserDisplayName(user) : "Account"}
                    </span>
                  </span>
                  {!user && (
                    <span className="uppercase text-xs font-extrabold text-brand-text">
                      Sign In
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={cycleTheme}
                  className="focus-ring flex min-h-12 w-full items-center justify-between rounded-xl border-2 border-border bg-surface px-3.5 text-sm font-extrabold text-text"
                >
                  <span className="flex items-center gap-3">
                    {theme === "dark" ? (
                      <Moon className="h-5 w-5 text-brand-text shrink-0" />
                    ) : (
                      <Sun className="h-5 w-5 text-brand-text shrink-0" />
                    )}
                    <span>Theme</span>
                  </span>
                  <span className="uppercase text-xs font-extrabold text-brand-text">
                    {theme}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setMobileMenuOpen(false);
                    setShowPatchNotes(true);
                  }}
                  className="focus-ring flex min-h-12 w-full items-center justify-between rounded-xl border-2 border-border bg-surface px-3.5 text-sm font-extrabold text-text"
                >
                  <span>Patch Notes</span>
                  <span className="uppercase text-xs font-extrabold text-brand-text">
                    {APP_VERSION}
                  </span>
                </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pb-24 md:pb-12 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mx-auto max-w-[860px]">
          {isOffline && (
            <div
              role="status"
              className="mb-4 flex items-center gap-2.5 rounded-2xl border-2 border-warning/50 bg-warning/10 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-warning"
            >
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>
                Offline mode &mdash; your cached quizzes and progress are still
                available locally.
              </span>
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 inset-x-0 z-30 grid md:hidden grid-cols-5 gap-1 border-t-2 border-border bg-surface px-1.5 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))]"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => sound.playClick()}
              className={`focus-ring flex min-h-[52px] w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                active
                  ? "bg-brand-tint text-brand-text"
                  : "text-text-muted"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
              <span className="w-full truncate text-center">{label}</span>
            </Link>
          );
        })}
      </nav>
      </div>

      <Modal
        open={showPatchNotes}
        onClose={() => setShowPatchNotes(false)}
        title={`Patch Notes (${APP_VERSION})`}
      >
        <div className="max-h-96 overflow-y-auto flex flex-col gap-3 pr-1 pb-1">
          {PATCH_NOTES.map((note) => (
            <Card key={note.version} className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="shrink-0 rounded-full bg-brand-tint px-2.5 py-0.5 text-xs font-extrabold text-brand-text">
                    {note.version}
                  </span>
                  <span className="shrink-0 text-xs font-bold text-text-faint">
                    {note.date}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-text leading-snug">
                  {note.title}
                </h3>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-sm font-semibold text-text-muted">
                {note.changes.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Modal>
      <AuthModal />
      <GuestMergeModal />
    </MotionConfig>
  );
}
