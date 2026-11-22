import type { SupabaseClient } from "@supabase/supabase-js";
import {
  clearRemoteUserData,
  deleteQuizSetRemote,
  insertAttemptRemote,
  updateQuizTitleRemote,
  upsertQuizSet,
  upsertUnlockedBadgesRemote,
} from "./supabase/sync";
import type { BadgeId, QuizAttempt, QuizSet } from "./types";

const OFFLINE_QUEUE_KEY = "quizapp:offline-queue";

export type OfflineMutation =
  | { type: "upsert_quiz"; quizSet: QuizSet }
  | { type: "rename_quiz"; id: string; title: string }
  | { type: "delete_quiz"; id: string }
  | { type: "insert_attempt"; attempt: QuizAttempt }
  | { type: "upsert_badges"; unlockedBadges: BadgeId[] }
  | { type: "clear_all" };

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getOfflineQueue(): OfflineMutation[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OfflineMutation[]) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(queue: OfflineMutation[]): void {
  if (!isBrowser()) return;
  if (queue.length === 0) {
    window.localStorage.removeItem(OFFLINE_QUEUE_KEY);
    return;
  }
  window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Pure reducer that appends a mutation and compacts redundant entries
 * (e.g. clear_all wipes prior mutations; delete_quiz drops prior upserts for that id).
 */
export function compactOfflineQueue(
  queue: OfflineMutation[],
  mutation: OfflineMutation
): OfflineMutation[] {
  if (mutation.type === "clear_all") {
    return [mutation];
  }

  if (mutation.type === "delete_quiz") {
    const filtered = queue.filter(
      (m) =>
        !(
          (m.type === "upsert_quiz" && m.quizSet.id === mutation.id) ||
          (m.type === "rename_quiz" && m.id === mutation.id) ||
          (m.type === "delete_quiz" && m.id === mutation.id)
        )
    );
    return [...filtered, mutation];
  }

  if (mutation.type === "upsert_badges") {
    const filtered = queue.filter((m) => m.type !== "upsert_badges");
    return [...filtered, mutation];
  }

  return [...queue, mutation];
}

export function enqueueOfflineMutation(mutation: OfflineMutation): number {
  const next = compactOfflineQueue(getOfflineQueue(), mutation);
  saveOfflineQueue(next);
  return next.length;
}

export async function flushOfflineQueue(
  supabase: SupabaseClient,
  userId: string
): Promise<{ flushed: number; remaining: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { flushed: 0, remaining: 0 };

  let flushed = 0;
  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    try {
      switch (item.type) {
        case "upsert_quiz":
          await upsertQuizSet(supabase, userId, item.quizSet);
          break;
        case "rename_quiz":
          await updateQuizTitleRemote(supabase, userId, item.id, item.title);
          break;
        case "delete_quiz":
          await deleteQuizSetRemote(supabase, userId, item.id);
          break;
        case "insert_attempt":
          await insertAttemptRemote(supabase, userId, item.attempt);
          break;
        case "upsert_badges":
          await upsertUnlockedBadgesRemote(
            supabase,
            userId,
            item.unlockedBadges
          );
          break;
        case "clear_all":
          await clearRemoteUserData(supabase, userId);
          break;
      }
      flushed++;
    } catch {
      const remaining = queue.slice(i);
      saveOfflineQueue(remaining);
      return { flushed, remaining: remaining.length };
    }
  }

  saveOfflineQueue([]);
  return { flushed, remaining: 0 };
}
