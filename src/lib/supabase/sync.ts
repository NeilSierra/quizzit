import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BadgeId,
  Question,
  QuizAttempt,
  QuizSet,
  QuizSettings,
  UserAnswer,
  UserStats,
} from "../types";

interface DbQuizSetRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  questions: Question[];
  created_at: string;
}

interface DbAttemptRow {
  id: string;
  user_id: string;
  quiz_set_id: string;
  quiz_title: string;
  settings: QuizSettings;
  answers: UserAnswer[];
  started_at: number;
  finished_at: number;
  total_score: number;
  accuracy: number;
  longest_streak: number;
}

interface DbStatsRow {
  user_id: string;
  unlocked_badges: BadgeId[];
}

export function computeGuestMergeDiff(
  cloudSets: QuizSet[],
  cloudAttempts: QuizAttempt[],
  cloudBadges: BadgeId[],
  localSets: QuizSet[],
  localAttempts: QuizAttempt[],
  localBadges: BadgeId[]
) {
  const cloudSetIds = new Set(cloudSets.map((s) => s.id));
  const cloudAttemptIds = new Set(cloudAttempts.map((a) => a.id));

  const setsToInsert = localSets.filter((s) => !cloudSetIds.has(s.id));
  const attemptsToInsert = localAttempts.filter(
    (a) => !cloudAttemptIds.has(a.id)
  );
  const mergedBadges = Array.from(
    new Set<BadgeId>([...cloudBadges, ...localBadges])
  );

  return {
    setsToInsert,
    attemptsToInsert,
    mergedBadges,
    mergedSets: [...setsToInsert, ...cloudSets],
    mergedAttempts: [...attemptsToInsert, ...cloudAttempts].sort(
      (a, b) => b.finishedAt - a.finishedAt
    ),
  };
}

export async function fetchUserData(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  quizSets: QuizSet[];
  attempts: QuizAttempt[];
  stats: UserStats;
}> {
  const [setsRes, attemptsRes, statsRes] = await Promise.all([
    supabase
      .from("quiz_sets")
      .select("id, user_id, title, description, questions, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("quiz_attempts")
      .select(
        "id, user_id, quiz_set_id, quiz_title, settings, answers, started_at, finished_at, total_score, accuracy, longest_streak"
      )
      .eq("user_id", userId)
      .order("finished_at", { ascending: false }),
    supabase
      .from("user_stats")
      .select("user_id, unlocked_badges")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (setsRes.error) throw setsRes.error;
  if (attemptsRes.error) throw attemptsRes.error;
  if (statsRes.error) throw statsRes.error;

  const quizSets: QuizSet[] = ((setsRes.data ?? []) as DbQuizSetRow[]).map(
    (row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      createdAt: new Date(row.created_at).getTime(),
      questions: row.questions ?? [],
    })
  );

  const attempts: QuizAttempt[] = (
    (attemptsRes.data ?? []) as DbAttemptRow[]
  ).map((row) => ({
    id: row.id,
    quizSetId: row.quiz_set_id,
    quizTitle: row.quiz_title,
    settings: row.settings,
    answers: row.answers ?? [],
    startedAt: Number(row.started_at),
    finishedAt: Number(row.finished_at),
    totalScore: Number(row.total_score),
    accuracy: Number(row.accuracy),
    longestStreak: Number(row.longest_streak),
  }));

  const statsRow = statsRes.data as DbStatsRow | null;
  const stats: UserStats = {
    unlockedBadges: statsRow?.unlocked_badges ?? [],
  };

  return { quizSets, attempts, stats };
}

export async function upsertQuizSet(
  supabase: SupabaseClient,
  userId: string,
  quizSet: QuizSet
): Promise<void> {
  const { error } = await supabase.from("quiz_sets").upsert({
    id: quizSet.id,
    user_id: userId,
    title: quizSet.title,
    description: quizSet.description ?? null,
    questions: quizSet.questions,
    created_at: new Date(quizSet.createdAt).toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function updateQuizTitleRemote(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  title: string
): Promise<void> {
  const { error } = await supabase
    .from("quiz_sets")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function deleteQuizSetRemote(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("quiz_sets")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function insertAttemptRemote(
  supabase: SupabaseClient,
  userId: string,
  attempt: QuizAttempt
): Promise<void> {
  const { error } = await supabase.from("quiz_attempts").upsert({
    id: attempt.id,
    user_id: userId,
    quiz_set_id: attempt.quizSetId,
    quiz_title: attempt.quizTitle,
    settings: attempt.settings,
    answers: attempt.answers,
    started_at: attempt.startedAt,
    finished_at: attempt.finishedAt,
    total_score: attempt.totalScore,
    accuracy: attempt.accuracy,
    longest_streak: attempt.longestStreak,
  });
  if (error) throw error;
}

export async function upsertUnlockedBadgesRemote(
  supabase: SupabaseClient,
  userId: string,
  unlockedBadges: BadgeId[]
): Promise<void> {
  const { error } = await supabase.from("user_stats").upsert({
    user_id: userId,
    unlocked_badges: unlockedBadges,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function clearRemoteUserData(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await Promise.all([
    supabase.from("quiz_sets").delete().eq("user_id", userId),
    supabase.from("quiz_attempts").delete().eq("user_id", userId),
    supabase.from("user_stats").delete().eq("user_id", userId),
  ]);
}

export async function mergeGuestDataToCloud(
  supabase: SupabaseClient,
  userId: string,
  localSets: QuizSet[],
  localAttempts: QuizAttempt[],
  localBadges: BadgeId[]
) {
  const cloud = await fetchUserData(supabase, userId);
  const diff = computeGuestMergeDiff(
    cloud.quizSets,
    cloud.attempts,
    cloud.stats.unlockedBadges,
    localSets,
    localAttempts,
    localBadges
  );

  if (diff.setsToInsert.length > 0) {
    const { error } = await supabase.from("quiz_sets").upsert(
      diff.setsToInsert.map((s) => ({
        id: s.id,
        user_id: userId,
        title: s.title,
        description: s.description ?? null,
        questions: s.questions,
        created_at: new Date(s.createdAt).toISOString(),
        updated_at: new Date().toISOString(),
      }))
    );
    if (error) throw error;
  }

  if (diff.attemptsToInsert.length > 0) {
    const { error } = await supabase.from("quiz_attempts").upsert(
      diff.attemptsToInsert.map((a) => ({
        id: a.id,
        user_id: userId,
        quiz_set_id: a.quizSetId,
        quiz_title: a.quizTitle,
        settings: a.settings,
        answers: a.answers,
        started_at: a.startedAt,
        finished_at: a.finishedAt,
        total_score: a.totalScore,
        accuracy: a.accuracy,
        longest_streak: a.longestStreak,
      }))
    );
    if (error) throw error;
  }

  if (diff.mergedBadges.length > cloud.stats.unlockedBadges.length) {
    await upsertUnlockedBadgesRemote(supabase, userId, diff.mergedBadges);
  }

  return {
    quizSets: diff.mergedSets,
    attempts: diff.mergedAttempts,
    stats: { unlockedBadges: diff.mergedBadges },
  };
}
