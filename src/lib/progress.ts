import type { Question, QuizAttempt } from "./types";

export interface QuizProgressSummary {
  unquizzed: Question[];
  redemption: Question[];
  masteredCount: number;
  hasPriorAttempts: boolean;
}

/**
 * Classifies a quiz set's questions based on the user's most recent answer
 * per question across all attempts for that quizSetId:
 * - unquizzed: never answered
 * - redemption: most recent answer was incorrect (not yet redeemed)
 * - mastered: most recent answer was correct
 */
export function getQuizProgress(
  questions: Question[],
  attempts: QuizAttempt[],
  quizSetId: string
): QuizProgressSummary {
  const matching = attempts.filter((a) => a.quizSetId === quizSetId);
  if (matching.length === 0) {
    return {
      unquizzed: questions,
      redemption: [],
      masteredCount: 0,
      hasPriorAttempts: false,
    };
  }

  // Sort oldest -> newest so later attempts overwrite earlier ones
  const chronological = [...matching].sort(
    (a, b) => a.finishedAt - b.finishedAt
  );
  const latestCorrectness = new Map<string, boolean>();

  for (const att of chronological) {
    for (const ans of att.answers) {
      latestCorrectness.set(ans.questionId, ans.isCorrect);
    }
  }

  const unquizzed: Question[] = [];
  const redemption: Question[] = [];
  let masteredCount = 0;

  for (const q of questions) {
    const state = latestCorrectness.get(q.id);
    if (state === undefined) {
      unquizzed.push(q);
    } else if (state === false) {
      redemption.push(q);
    } else {
      masteredCount += 1;
    }
  }

  return {
    unquizzed,
    redemption,
    masteredCount,
    hasPriorAttempts: true,
  };
}
