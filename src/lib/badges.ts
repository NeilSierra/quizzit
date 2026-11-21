import type { Badge, BadgeId, QuizAttempt, UserStats } from "./types";

export const ALL_BADGES: Badge[] = [
  {
    id: "first_quiz",
    name: "First Steps",
    description: "Complete your very first quiz.",
    icon: "🎯",
  },
  {
    id: "perfect_score",
    name: "Perfectionist",
    description: "Score 100% on any quiz.",
    icon: "🏆",
  },
  {
    id: "comeback_20",
    name: "Big Comeback",
    description: "Improve your score on a quiz by 20% or more.",
    icon: "🚀",
  },
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Finish a timed quiz with at least 25% of the time remaining.",
    icon: "⚡",
  },
];

/**
 * Computes updated UserStats and returns any newly unlocked badges for an attempt.
 */
export function evaluateAttemptProgress(
  currentStats: UserStats,
  attempt: QuizAttempt,
  previousAttemptsForSet: QuizAttempt[]
): { nextStats: UserStats; newlyUnlocked: Badge[] } {
  const unlocked = new Set<BadgeId>(currentStats.unlockedBadges);
  const newlyUnlocked: BadgeId[] = [];

  const unlock = (id: BadgeId) => {
    if (!unlocked.has(id)) {
      unlocked.add(id);
      newlyUnlocked.push(id);
    }
  };

  unlock("first_quiz");
  if (attempt.accuracy === 100) unlock("perfect_score");

  if (previousAttemptsForSet.length > 0) {
    const prevLatest = previousAttemptsForSet[0];
    if (attempt.accuracy - prevLatest.accuracy >= 20) {
      unlock("comeback_20");
    }
  }

  if (attempt.settings.timerMinutes && attempt.settings.timerMinutes > 0) {
    const allowedMs = attempt.settings.timerMinutes * 60 * 1000;
    const elapsedMs = attempt.finishedAt - attempt.startedAt;
    if (elapsedMs <= allowedMs * 0.75) {
      unlock("speed_demon");
    }
  }

  return {
    nextStats: {
      unlockedBadges: Array.from(unlocked),
    },
    newlyUnlocked: ALL_BADGES.filter((b) => newlyUnlocked.includes(b.id)),
  };
}
