import { convertQuestionsToMode } from "./convert";
import type { MultipleChoiceQuestion, Question, QuizSettings } from "./types";

/**
 * Fisher-Yates shuffle returning a new array.
 */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Shuffles multiple-choice options and remaps the correct answer indices.
 */
export function remapMultipleChoice(
  q: MultipleChoiceQuestion
): MultipleChoiceQuestion {
  const indexed = q.choices.map((choice, originalIndex) => ({
    choice,
    isCorrect: q.answer.includes(originalIndex),
  }));
  const shuffled = shuffle(indexed);
  const newChoices = shuffled.map((item) => item.choice);
  const newAnswer = shuffled
    .map((item, idx) => (item.isCorrect ? idx : -1))
    .filter((idx) => idx !== -1);

  return {
    ...q,
    choices: newChoices,
    answer: newAnswer,
  };
}

/**
 * Filters, subsets, and shuffles questions & choices once when a session starts.
 */
export function prepareSessionQuestions(
  questions: Question[],
  settings: QuizSettings
): Question[] {
  let pool =
    settings.targetMode && settings.targetMode !== "original"
      ? convertQuestionsToMode(questions, settings.targetMode)
      : questions.filter((q) => settings.types.includes(q.type));

  if (settings.shuffleQuestions) {
    pool = shuffle(pool);
  }

  if (
    settings.questionCount !== "all" &&
    settings.questionCount > 0 &&
    settings.questionCount < pool.length
  ) {
    pool = pool.slice(0, settings.questionCount);
  }

  if (settings.shuffleChoices) {
    pool = pool.map((q) =>
      q.type === "multiple_choice" ? remapMultipleChoice(q) : q
    );
  }

  return pool;
}
