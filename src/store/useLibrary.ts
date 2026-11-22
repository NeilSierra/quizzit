"use client";

import { create } from "zustand";
import { ALL_BADGES, evaluateAttemptProgress } from "@/lib/badges";
import {
  enqueueOfflineMutation,
  type OfflineMutation,
} from "@/lib/offlineQueue";
import { parseJsonImport, SAMPLE_QUIZ_JSON } from "@/lib/parsers/json";
import { questionSchema } from "@/lib/schema";
import { storage } from "@/lib/storage";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  clearRemoteUserData,
  deleteQuizSetRemote,
  insertAttemptRemote,
  updateQuizTitleRemote,
  upsertQuizSet,
  upsertUnlockedBadgesRemote,
} from "@/lib/supabase/sync";
import type {
  Badge,
  BadgeId,
  Question,
  QuizAttempt,
  QuizSet,
  ThemePreference,
  UiScale,
  UserStats,
} from "@/lib/types";
import { useAuth } from "./useAuth";

export interface BackupImportResult {
  ok: boolean;
  addedQuizzes: number;
  addedAttempts: number;
  addedBadges: number;
  error?: string;
}

interface LibraryState {
  quizSets: QuizSet[];
  attempts: QuizAttempt[];
  stats: UserStats;
  theme: ThemePreference;
  soundEnabled: boolean;
  uiScale: UiScale;
  hydrated: boolean;
  hydrate: () => void;
  addQuizSet: (title: string, questions: Question[], description?: string) => QuizSet;
  renameQuizSet: (id: string, title: string) => void;
  deleteQuizSet: (id: string) => void;
  importSampleQuiz: () => QuizSet;
  importBackup: (rawJson: string) => BackupImportResult;
  recordAttempt: (attempt: QuizAttempt) => {
    newlyUnlocked: Badge[];
    previousBest: number | null;
    previousLatest: number | null;
  };
  setTheme: (theme: ThemePreference) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setUiScale: (scale: UiScale) => void;
  setCloudData: (
    quizSets: QuizSet[],
    attempts: QuizAttempt[],
    stats: UserStats
  ) => void;
  resetToLocalGuest: () => void;
  clearAll: () => void;
}

function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function applyThemeToDom(theme: ThemePreference) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

export function applyUiScaleToDom(scale: UiScale) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-ui-scale", scale);
}

function runCloudOrQueue(
  remoteCall: (
    supabase: NonNullable<ReturnType<typeof createSupabaseBrowserClient>>,
    userId: string
  ) => Promise<void>,
  mutation: OfflineMutation
) {
  const user = useAuth.getState().user;
  const supabase = createSupabaseBrowserClient();
  if (!user || !supabase) return;

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    enqueueOfflineMutation(mutation);
    useAuth.getState().refreshPendingSync();
    return;
  }

  void remoteCall(supabase, user.id).catch(() => {
    enqueueOfflineMutation(mutation);
    useAuth.getState().refreshPendingSync();
  });
}

export const useLibrary = create<LibraryState>((set, get) => ({
  quizSets: [],
  attempts: [],
  stats: {
    unlockedBadges: [],
  },
  theme: "system",
  soundEnabled: true,
  uiScale: "default",
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const quizSets = storage.getLibrary();
    const attempts = storage.getAttempts();
    const stats = storage.getStats();
    const theme = storage.getTheme();
    const soundEnabled = storage.getSoundEnabled();
    const uiScale = storage.getUiScale();
    applyThemeToDom(theme);
    applyUiScaleToDom(uiScale);
    set({
      quizSets,
      attempts,
      stats,
      theme,
      soundEnabled,
      uiScale,
      hydrated: true,
    });
  },

  addQuizSet: (title, questions, description) => {
    const newSet: QuizSet = {
      id: generateId("quiz"),
      title: title.trim() || "Untitled Quiz",
      description: description?.trim() || undefined,
      createdAt: Date.now(),
      questions,
    };
    const next = [newSet, ...get().quizSets];
    storage.saveLibrary(next);
    runCloudOrQueue(
      (sb, uid) => upsertQuizSet(sb, uid, newSet),
      { type: "upsert_quiz", quizSet: newSet }
    );
    set({ quizSets: next });
    return newSet;
  },

  renameQuizSet: (id, title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const next = get().quizSets.map((q) =>
      q.id === id ? { ...q, title: trimmed } : q
    );
    storage.saveLibrary(next);
    runCloudOrQueue(
      (sb, uid) => updateQuizTitleRemote(sb, uid, id, trimmed),
      { type: "rename_quiz", id, title: trimmed }
    );
    set({ quizSets: next });
  },

  deleteQuizSet: (id) => {
    const next = get().quizSets.filter((q) => q.id !== id);
    storage.saveLibrary(next);
    runCloudOrQueue(
      (sb, uid) => deleteQuizSetRemote(sb, uid, id),
      { type: "delete_quiz", id }
    );
    set({ quizSets: next });
  },

  importSampleQuiz: () => {
    const parsed = parseJsonImport(SAMPLE_QUIZ_JSON);
    return get().addQuizSet(
      parsed.title,
      parsed.validQuestions,
      parsed.description
    );
  },

  importBackup: (rawJson) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      return {
        ok: false,
        addedQuizzes: 0,
        addedAttempts: 0,
        addedBadges: 0,
        error: "Invalid JSON file.",
      };
    }

    if (!parsed || typeof parsed !== "object") {
      return {
        ok: false,
        addedQuizzes: 0,
        addedAttempts: 0,
        addedBadges: 0,
        error: "Backup file must be a JSON object.",
      };
    }

    const obj = parsed as Record<string, unknown>;
    if (!Array.isArray(obj.library) && !Array.isArray(obj.attempts)) {
      return {
        ok: false,
        addedQuizzes: 0,
        addedAttempts: 0,
        addedBadges: 0,
        error: 'Invalid backup format: missing "library" or "attempts" arrays.',
      };
    }

    const existingIds = new Set(get().quizSets.map((q) => q.id));
    const newSets: QuizSet[] = [];
    if (Array.isArray(obj.library)) {
      for (const item of obj.library) {
        if (!item || typeof item !== "object") continue;
        const rawSet = item as Record<string, unknown>;
        if (typeof rawSet.id !== "string" || existingIds.has(rawSet.id)) continue;
        if (typeof rawSet.title !== "string" || !Array.isArray(rawSet.questions)) continue;

        const validQs: Question[] = [];
        for (const q of rawSet.questions) {
          const res = questionSchema.safeParse(q);
          if (res.success) {
            validQs.push({
              ...res.data,
              id: res.data.id ?? generateId("q"),
            });
          }
        }
        if (validQs.length === 0) continue;

        existingIds.add(rawSet.id);
        newSets.push({
          id: rawSet.id,
          title: rawSet.title.trim() || "Imported Quiz",
          description:
            typeof rawSet.description === "string"
              ? rawSet.description
              : undefined,
          createdAt:
            typeof rawSet.createdAt === "number"
              ? rawSet.createdAt
              : Date.now(),
          questions: validQs,
        });
      }
    }

    const existingAttemptIds = new Set(get().attempts.map((a) => a.id));
    const newAttempts: QuizAttempt[] = [];
    if (Array.isArray(obj.attempts)) {
      for (const item of obj.attempts) {
        if (!item || typeof item !== "object") continue;
        const att = item as QuizAttempt;
        if (
          typeof att.id !== "string" ||
          existingAttemptIds.has(att.id) ||
          typeof att.quizSetId !== "string" ||
          typeof att.accuracy !== "number"
        ) {
          continue;
        }
        existingAttemptIds.add(att.id);
        newAttempts.push(att);
      }
    }

    const validBadgeIds = new Set<BadgeId>(ALL_BADGES.map((b) => b.id));
    const existingBadges = new Set<BadgeId>(get().stats.unlockedBadges);
    let addedBadges = 0;
    const rawStats = obj.stats as Record<string, unknown> | undefined;
    if (rawStats && Array.isArray(rawStats.unlockedBadges)) {
      for (const b of rawStats.unlockedBadges) {
        if (
          typeof b === "string" &&
          validBadgeIds.has(b as BadgeId) &&
          !existingBadges.has(b as BadgeId)
        ) {
          existingBadges.add(b as BadgeId);
          addedBadges++;
        }
      }
    }

    const mergedLibrary = [...newSets, ...get().quizSets];
    const mergedAttempts = [...newAttempts, ...get().attempts].sort(
      (a, b) => b.finishedAt - a.finishedAt
    );
    const mergedStats: UserStats = {
      unlockedBadges: Array.from(existingBadges),
    };

    storage.saveLibrary(mergedLibrary);
    storage.saveAttempts(mergedAttempts);
    storage.saveStats(mergedStats);
    for (const s of newSets) {
      runCloudOrQueue(
        (sb, uid) => upsertQuizSet(sb, uid, s),
        { type: "upsert_quiz", quizSet: s }
      );
    }
    for (const a of newAttempts) {
      runCloudOrQueue(
        (sb, uid) => insertAttemptRemote(sb, uid, a),
        { type: "insert_attempt", attempt: a }
      );
    }
    if (addedBadges > 0) {
      runCloudOrQueue(
        (sb, uid) => upsertUnlockedBadgesRemote(sb, uid, mergedStats.unlockedBadges),
        { type: "upsert_badges", unlockedBadges: mergedStats.unlockedBadges }
      );
    }
    set({
      quizSets: mergedLibrary,
      attempts: mergedAttempts,
      stats: mergedStats,
    });

    return {
      ok: true,
      addedQuizzes: newSets.length,
      addedAttempts: newAttempts.length,
      addedBadges,
    };
  },

  recordAttempt: (attempt) => {
    const prevAttemptsForSet = get().attempts.filter(
      (a) => a.quizSetId === attempt.quizSetId
    );
    const previousBest =
      prevAttemptsForSet.length > 0
        ? Math.max(...prevAttemptsForSet.map((a) => a.accuracy))
        : null;
    const previousLatest =
      prevAttemptsForSet.length > 0 ? prevAttemptsForSet[0].accuracy : null;

    const { nextStats, newlyUnlocked } = evaluateAttemptProgress(
      get().stats,
      attempt,
      prevAttemptsForSet
    );

    const nextAttempts = [attempt, ...get().attempts];
    storage.saveAttempts(nextAttempts);
    storage.saveStats(nextStats);
    runCloudOrQueue(
      (sb, uid) => insertAttemptRemote(sb, uid, attempt),
      { type: "insert_attempt", attempt }
    );
    if (newlyUnlocked.length > 0) {
      runCloudOrQueue(
        (sb, uid) => upsertUnlockedBadgesRemote(sb, uid, nextStats.unlockedBadges),
        { type: "upsert_badges", unlockedBadges: nextStats.unlockedBadges }
      );
    }
    set({ attempts: nextAttempts, stats: nextStats });

    return { newlyUnlocked, previousBest, previousLatest };
  },

  setTheme: (theme) => {
    storage.saveTheme(theme);
    applyThemeToDom(theme);
    set({ theme });
  },

  setSoundEnabled: (enabled) => {
    storage.saveSoundEnabled(enabled);
    set({ soundEnabled: enabled });
  },

  setUiScale: (scale) => {
    storage.saveUiScale(scale);
    applyUiScaleToDom(scale);
    set({ uiScale: scale });
  },

  setCloudData: (quizSets, attempts, stats) => {
    storage.saveLibrary(quizSets);
    storage.saveAttempts(attempts);
    storage.saveStats(stats);
    set({ quizSets, attempts, stats });
  },

  resetToLocalGuest: () => {
    set({
      quizSets: storage.getLibrary(),
      attempts: storage.getAttempts(),
      stats: storage.getStats(),
    });
  },

  clearAll: () => {
    storage.clearAllData();
    runCloudOrQueue(
      (sb, uid) => clearRemoteUserData(sb, uid),
      { type: "clear_all" }
    );
    set({
      quizSets: [],
      attempts: [],
      stats: {
        unlockedBadges: [],
      },
    });
  },
}));
