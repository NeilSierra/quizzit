"use client";

import { useRef, useState } from "react";
import { Cloud, Download, ExternalLink, Lock, LogIn, LogOut, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Toggle } from "@/components/ui/Toggle";
import { APP_VERSION, PATCH_NOTES } from "@/lib/changelog";
import { sound } from "@/lib/sound";
import { storage } from "@/lib/storage";
import type { ThemePreference, UiScale } from "@/lib/types";
import { getUserDisplayName, useAuth } from "@/store/useAuth";
import { useLibrary } from "@/store/useLibrary";

export default function SettingsPage() {
  const theme = useLibrary((s) => s.theme);
  const setTheme = useLibrary((s) => s.setTheme);
  const soundEnabled = useLibrary((s) => s.soundEnabled);
  const setSoundEnabled = useLibrary((s) => s.setSoundEnabled);
  const uiScale = useLibrary((s) => s.uiScale);
  const setUiScale = useLibrary((s) => s.setUiScale);
  const importBackup = useLibrary((s) => s.importBackup);
  const clearAll = useLibrary((s) => s.clearAll);
  const hydrated = useLibrary((s) => s.hydrated);
  const user = useAuth((s) => s.user);
  const syncing = useAuth((s) => s.syncing);
  const openAuthModal = useAuth((s) => s.openAuthModal);
  const signOut = useAuth((s) => s.signOut);

  const [confirmClear, setConfirmClear] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [backupNotice, setBackupNotice] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const handleExportAll = () => {
    const json = storage.exportAllData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quizzit-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBackupFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importBackup(String(reader.result ?? ""));
      if (res.ok) {
        sound.playCorrect();
        setBackupNotice({
          ok: true,
          message: `Backup merged: +${res.addedQuizzes} quizzes, +${res.addedAttempts} attempts, +${res.addedBadges} badges.`,
        });
      } else {
        sound.playWrong();
        setBackupNotice({
          ok: false,
          message: res.error ?? "Failed to import backup.",
        });
      }
    };
    reader.readAsText(file);
  };

  if (!hydrated) {
    return (
      <div className="py-12 text-center font-bold text-text-muted">
        Loading preferences...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text">Settings</h1>
          <p className="text-base font-semibold text-text-muted">
            Customize appearance, sound effects, and local device backups.
          </p>
        </div>
        <span className="shrink-0 rounded-full border-2 border-border bg-surface px-3 py-1 text-xs font-extrabold text-brand-text">
          {APP_VERSION}
        </span>
      </div>

      {/* Account & Cloud Sync */}
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-extrabold text-text">
          Account &amp; Cloud Sync
        </h2>
        <Card className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand-text">
              {user ? <Cloud className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
            </div>
            <div>
              <div className="font-extrabold text-text">
                {user ? getUserDisplayName(user) : "Guest Mode (Local Only)"}
              </div>
              <div className="text-sm font-semibold text-text-muted">
                {user
                  ? syncing
                    ? "Syncing your private library..."
                    : "Synced to your private Supabase account. No shared library."
                  : "Sign in to save your quizzes privately across devices."}
              </div>
            </div>
          </div>

          {user ? (
            <Button variant="secondary" onClick={() => void signOut()}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            <Button variant="primary" onClick={openAuthModal}>
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          )}
        </Card>
      </section>

      {/* Appearance & Audio */}
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-extrabold text-text">
          Appearance &amp; Audio
        </h2>
        <Card className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="font-extrabold text-text">Theme</div>
              <div className="text-sm font-semibold text-text-muted">
                Follows your system preference by default
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["system", "light", "dark"] as ThemePreference[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setTheme(opt);
                  }}
                  className={`focus-ring rounded-xl border-2 px-3.5 py-1.5 text-sm font-extrabold capitalize ${
                    theme === opt
                      ? "border-brand-fill bg-brand-tint text-brand-text"
                      : "border-border bg-surface text-text-muted"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t-2 border-border pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="font-extrabold text-text">UI Size</div>
              <div className="text-sm font-semibold text-text-muted">
                Adjust the overall scale of text, buttons, and cards
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "compact", label: "Compact" },
                  { id: "default", label: "Default" },
                  { id: "large", label: "Large" },
                ] as { id: UiScale; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setUiScale(opt.id);
                  }}
                  className={`focus-ring rounded-xl border-2 px-3.5 py-1.5 text-sm font-extrabold ${
                    uiScale === opt.id
                      ? "border-brand-fill bg-brand-tint text-brand-text"
                      : "border-border bg-surface text-text-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t-2 border-border pt-4">
            <Toggle
              checked={soundEnabled}
              onChange={(enabled) => {
                setSoundEnabled(enabled);
                if (enabled) sound.playCorrect();
              }}
              label="Sound Effects"
              description="Play gentle chimes for clicks, answers, and quiz completion"
            />
          </div>
        </Card>
      </section>

      {/* Local Data & Backups */}
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-extrabold text-text">
          Device-Only Storage
        </h2>
        <Card className="flex flex-col gap-4">
          <div>
            <div className="font-extrabold text-text">Backup &amp; Reset</div>
            <div className="text-sm font-semibold text-text-muted">
              All quizzes and attempts are stored locally in your browser.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3 gap-3">
            <Button variant="secondary" fullWidth onClick={handleExportAll}>
              <Download className="h-4 w-4" />
              Export Backup
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => backupInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Import Backup
            </Button>
            <input
              ref={backupInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                handleBackupFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button
              variant="danger"
              fullWidth
              onClick={() => setConfirmClear(true)}
            >
              <Trash2 className="h-4 w-4" />
              Clear All Data
            </Button>
          </div>

          {backupNotice && (
            <div
              role="status"
              className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold ${
                backupNotice.ok
                  ? "border-success bg-success-bg text-success"
                  : "border-danger bg-danger-bg text-danger"
              }`}
            >
              {backupNotice.message}
            </div>
          )}
        </Card>
      </section>

      {/* Patch Notes */}
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-extrabold text-text">Patch Notes</h2>
        <div className="flex flex-col gap-3">
          {(showAllNotes ? PATCH_NOTES : PATCH_NOTES.slice(0, 3)).map((note) => (
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
        {PATCH_NOTES.length > 3 && (
          <Button
            variant="secondary"
            onClick={() => setShowAllNotes((v) => !v)}
            className="self-start"
          >
            {showAllNotes
              ? "Show Less"
              : `Show Older (${PATCH_NOTES.length - 3})`}
          </Button>
        )}
      </section>

      {/* About the Creator */}
      <section id="about-creator" className="flex flex-col gap-3 scroll-mt-20">
        <h2 className="text-2xl font-extrabold text-text">About the Creator</h2>
        <Card className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src="/mascot/wave.png"
                alt="Quizzit mascot waving"
                className="h-16 w-16 shrink-0 rounded-2xl border-2 border-border bg-brand-tint/40 p-1 object-contain"
              />
              <div className="flex flex-col gap-0.5">
                <h3 className="text-lg font-extrabold text-text leading-tight">
                  Neil Sierra
                </h3>
                <p className="text-sm font-bold text-brand-text">
                  @NeilSierra · Developer &amp; Creator of Quizzit
                </p>
              </div>
            </div>
            <a
              href="https://github.com/NeilSierra"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto shrink-0"
            >
              <Button variant="secondary" className="w-full sm:w-auto">
                <ExternalLink className="h-4 w-4" />
                GitHub Profile
              </Button>
            </a>
          </div>

          <p className="text-sm font-semibold text-text-muted leading-relaxed">
            Built Quizzit to be a fast, distraction-free study and quiz PWA so
            anyone can turn their own notes, CSVs, and JSON files into
            interactive practice sessions — online or offline.
          </p>

          <div className="flex flex-wrap gap-2">
            {["Next.js", "Tailwind", "Supabase", "PWA"].map((tech) => (
              <span
                key={tech}
                className="rounded-full bg-brand-tint px-3 py-1 text-xs font-extrabold text-brand-text"
              >
                {tech}
              </span>
            ))}
          </div>
        </Card>
      </section>

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear all local data?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-base font-semibold text-text-muted">
            This will permanently delete all imported quizzes, past attempts,
            and badges from this browser.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                clearAll();
                setConfirmClear(false);
              }}
            >
              Clear Everything
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
