"use client";

import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { storage } from "@/lib/storage";
import {
  flushOfflineQueue,
  getOfflineQueue,
} from "@/lib/offlineQueue";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { fetchUserData, mergeGuestDataToCloud } from "@/lib/supabase/sync";
import { useLibrary } from "./useLibrary";

const MERGE_DISMISSED_KEY = "quizapp:guest-merge-dismissed";

export function getUserDisplayName(user: User | null): string {
  if (!user) return "Account";
  const metaName =
    (typeof user.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name.trim()) ||
    (typeof user.user_metadata?.name === "string" &&
      user.user_metadata.name.trim());
  if (metaName) return metaName;
  if (user.email) return user.email.split("@")[0] || "Account";
  return "Account";
}

interface AuthState {
  user: User | null;
  loading: boolean;
  syncing: boolean;
  configured: boolean;
  initialized: boolean;
  authModalOpen: boolean;
  pendingGuestMerge: boolean;
  pendingSyncCount: number;

  initAuth: () => void;
  refreshPendingSync: () => void;
  syncOfflineQueue: () => Promise<void>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string; needsConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  mergeGuestData: () => Promise<void>;
  dismissGuestMerge: () => void;
}

async function syncUserFromCloud(user: User, set: (s: Partial<AuthState>) => void) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return;

  set({ syncing: true });
  try {
    await flushOfflineQueue(supabase, user.id);
    set({ pendingSyncCount: getOfflineQueue().length });

    const cloud = await fetchUserData(supabase, user.id);
    useLibrary
      .getState()
      .setCloudData(cloud.quizSets, cloud.attempts, cloud.stats);

    const localSets = storage.getLibrary();
    const localAttempts = storage.getAttempts();
    const dismissed =
      typeof window !== "undefined" &&
      window.localStorage.getItem(`${MERGE_DISMISSED_KEY}:${user.id}`) === "true";

    const cloudSetIds = new Set(cloud.quizSets.map((q) => q.id));
    const hasUnmergedLocal =
      localSets.some((q) => !cloudSetIds.has(q.id)) ||
      (localAttempts.length > 0 && cloud.attempts.length === 0);

    set({
      syncing: false,
      pendingGuestMerge: !dismissed && hasUnmergedLocal,
    });
  } catch {
    set({ syncing: false });
  }
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  syncing: false,
  configured: false,
  initialized: false,
  authModalOpen: false,
  pendingGuestMerge: false,
  pendingSyncCount: 0,

  refreshPendingSync: () => {
    set({ pendingSyncCount: getOfflineQueue().length });
  },

  syncOfflineQueue: async () => {
    const user = get().user;
    const supabase = createSupabaseBrowserClient();
    if (!user || !supabase) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    set({ syncing: true });
    try {
      await flushOfflineQueue(supabase, user.id);
      const remaining = getOfflineQueue().length;
      set({ pendingSyncCount: remaining, syncing: false });
      if (remaining === 0) {
        const cloud = await fetchUserData(supabase, user.id);
        useLibrary
          .getState()
          .setCloudData(cloud.quizSets, cloud.attempts, cloud.stats);
      }
    } catch {
      set({ syncing: false, pendingSyncCount: getOfflineQueue().length });
    }
  },

  initAuth: () => {
    if (get().initialized) return;
    const configured = isSupabaseConfigured();
    const supabase = createSupabaseBrowserClient();

    if (!configured || !supabase) {
      set({
        configured: false,
        loading: false,
        initialized: true,
        user: null,
      });
      return;
    }

    set({
      configured: true,
      initialized: true,
      pendingSyncCount: getOfflineQueue().length,
    });

    // Restore local session immediately so cold offline launches stay signed in
    supabase.auth
      .getSession()
      .then(({ data }) => {
        const localUser = data.session?.user ?? null;
        if (localUser) {
          set({ user: localUser, loading: false });
        }

        if (typeof navigator !== "undefined" && !navigator.onLine) {
          set({ loading: false });
          return;
        }

        return supabase.auth
          .getUser()
          .then(({ data: userData, error }) => {
            const verifiedUser = userData.user ?? null;
            if (error && typeof navigator !== "undefined" && !navigator.onLine) {
              set({ loading: false });
              return;
            }
            set({ user: verifiedUser ?? localUser, loading: false });
            const activeUser = verifiedUser ?? localUser;
            if (activeUser) {
              void syncUserFromCloud(activeUser, set);
            }
          })
          .catch(() => {
            set({ loading: false });
          });
      })
      .catch(() => {
        set({ loading: false });
      });

    supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      const prevUser = get().user;

      // Never demote to guest while offline due to a failed token refresh
      if (
        !nextUser &&
        prevUser &&
        typeof navigator !== "undefined" &&
        !navigator.onLine
      ) {
        set({ loading: false });
        return;
      }

      set({ user: nextUser, loading: false });

      if (nextUser && nextUser.id !== prevUser?.id) {
        void syncUserFromCloud(nextUser, set);
      } else if (!nextUser && prevUser) {
        set({ pendingGuestMerge: false });
        useLibrary.getState().resetToLocalGuest();
      }
    });
  },

  openAuthModal: () => set({ authModalOpen: true }),
  closeAuthModal: () => set({ authModalOpen: false }),

  signInWithEmail: async (email, password) => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      return { ok: false, error: "Supabase is not configured." };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { ok: false, error: error.message };
    set({ authModalOpen: false });
    return { ok: true };
  },

  signUpWithEmail: async (email, password) => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      return { ok: false, error: "Supabase is not configured." };
    }
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) return { ok: false, error: error.message };
    const needsConfirmation = !data.session;
    if (!needsConfirmation) {
      set({ authModalOpen: false });
    }
    return { ok: true, needsConfirmation };
  },

  signInWithGoogle: async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      return { ok: false, error: "Supabase is not configured." };
    }
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  signOut: async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ user: null, pendingGuestMerge: false });
    useLibrary.getState().resetToLocalGuest();
  },

  mergeGuestData: async () => {
    const user = get().user;
    const supabase = createSupabaseBrowserClient();
    if (!user || !supabase) return;

    set({ syncing: true });
    try {
      const localSets = storage.getLibrary();
      const localAttempts = storage.getAttempts();
      const localStats = storage.getStats();

      const merged = await mergeGuestDataToCloud(
        supabase,
        user.id,
        localSets,
        localAttempts,
        localStats.unlockedBadges
      );

      useLibrary
        .getState()
        .setCloudData(merged.quizSets, merged.attempts, merged.stats);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(`${MERGE_DISMISSED_KEY}:${user.id}`, "true");
      }
      set({ pendingGuestMerge: false, syncing: false });
    } catch {
      set({ syncing: false });
    }
  },

  dismissGuestMerge: () => {
    const user = get().user;
    if (user && typeof window !== "undefined") {
      window.localStorage.setItem(`${MERGE_DISMISSED_KEY}:${user.id}`, "true");
    }
    set({ pendingGuestMerge: false });
  },
}));
