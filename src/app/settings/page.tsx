"use client";

import { useRef, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Toggle } from "@/components/ui/Toggle";
import { sound } from "@/lib/sound";
import { storage } from "@/lib/storage";
import type { ThemePreference, UiScale } from "@/lib/types";
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

  const [confirmClear, setConfirmClear] = useState(false);
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
        <span className="shrink-0 rounded-full border-2 border-border bg-surface px-3 py-1 text-xs font-extrabold text-text-muted">
          v1.0
        </span>
      </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
