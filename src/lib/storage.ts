import type {
  Question,
  QuizAttempt,
  QuizSet,
  QuizSettings,
  ThemePreference,
  UiScale,
  UserAnswer,
  UserStats,
} from "./types";

const SCHEMA_VERSION = 1;

export const STORAGE_KEYS = {
  library: "quizapp:library",
  attempts: "quizapp:attempts",
  session: "quizapp:session",
  stats: "quizapp:stats",
  theme: "quizapp:theme",
  sound: "quizapp:sound",
  uiScale: "quizapp:ui-scale",
} as const;

interface VersionedPayload<T> {
  schemaVersion: number;
  data: T;
}

export interface PersistedSession {
  quizSetId: string;
  quizTitle: string;
  questions: Question[];
  settings: QuizSettings;
  currentIndex: number;
  answers: Record<string, UserAnswer>;
  startedAt: number;
  currentStreak: number;
  longestStreak: number;
  status: "in_progress";
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readVersioned<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as VersionedPayload<T> | T;
    if (
      parsed &&
      typeof parsed === "object" &&
      "schemaVersion" in parsed &&
      "data" in parsed
    ) {
      return (parsed as VersionedPayload<T>).data;
    }
    return parsed as T;
  } catch {
    return fallback;
  }
}

function writeVersioned<T>(key: string, data: T): void {
  if (!isBrowser()) return;
  const payload: VersionedPayload<T> = {
    schemaVersion: SCHEMA_VERSION,
    data,
  };
  window.localStorage.setItem(key, JSON.stringify(payload));
}

export const storage = {
  getLibrary(): QuizSet[] {
    return readVersioned<QuizSet[]>(STORAGE_KEYS.library, []);
  },
  saveLibrary(library: QuizSet[]): void {
    writeVersioned(STORAGE_KEYS.library, library);
  },

  getAttempts(): QuizAttempt[] {
    return readVersioned<QuizAttempt[]>(STORAGE_KEYS.attempts, []);
  },
  saveAttempts(attempts: QuizAttempt[]): void {
    writeVersioned(STORAGE_KEYS.attempts, attempts);
  },

  getSession(): PersistedSession | null {
    return readVersioned<PersistedSession | null>(STORAGE_KEYS.session, null);
  },
  saveSession(session: PersistedSession | null): void {
    if (!isBrowser()) return;
    if (session === null) {
      window.localStorage.removeItem(STORAGE_KEYS.session);
      return;
    }
    writeVersioned(STORAGE_KEYS.session, session);
  },

  getStats(): UserStats {
    return readVersioned<UserStats>(STORAGE_KEYS.stats, {
      unlockedBadges: [],
    });
  },
  saveStats(stats: UserStats): void {
    writeVersioned(STORAGE_KEYS.stats, stats);
  },

  getTheme(): ThemePreference {
    if (!isBrowser()) return "system";
    const raw = window.localStorage.getItem(STORAGE_KEYS.theme);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
    return "system";
  },
  saveTheme(theme: ThemePreference): void {
    if (!isBrowser()) return;
    window.localStorage.setItem(STORAGE_KEYS.theme, theme);
  },

  getSoundEnabled(): boolean {
    if (!isBrowser()) return true;
    const raw = window.localStorage.getItem(STORAGE_KEYS.sound);
    return raw !== "false";
  },
  saveSoundEnabled(enabled: boolean): void {
    if (!isBrowser()) return;
    window.localStorage.setItem(STORAGE_KEYS.sound, String(enabled));
  },

  getUiScale(): UiScale {
    if (!isBrowser()) return "default";
    const raw = window.localStorage.getItem(STORAGE_KEYS.uiScale);
    if (raw === "compact" || raw === "default" || raw === "large") return raw;
    return "default";
  },
  saveUiScale(scale: UiScale): void {
    if (!isBrowser()) return;
    window.localStorage.setItem(STORAGE_KEYS.uiScale, scale);
  },

  exportAllData(): string {
    return JSON.stringify(
      {
        schemaVersion: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        library: this.getLibrary(),
        attempts: this.getAttempts(),
        stats: this.getStats(),
      },
      null,
      2
    );
  },

  clearAllData(): void {
    if (!isBrowser()) return;
    window.localStorage.removeItem(STORAGE_KEYS.library);
    window.localStorage.removeItem(STORAGE_KEYS.attempts);
    window.localStorage.removeItem(STORAGE_KEYS.session);
    window.localStorage.removeItem(STORAGE_KEYS.stats);
  },
};
