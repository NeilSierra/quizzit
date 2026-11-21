import { isTypoMatch, normalize } from "./normalize";
import type { Question, UserAnswer } from "./types";

export function scoreMultipleChoice(
  selected: number[],
  answer: number[],
  multiSelect = false
): number {
  if (!multiSelect) {
    return selected.length === 1 && selected[0] === answer[0] ? 1 : 0;
  }
  const selectedSet = new Set(selected);
  const answerSet = new Set(answer);
  if (selectedSet.size !== answerSet.size) return 0;
  for (const idx of answerSet) {
    if (!selectedSet.has(idx)) return 0;
  }
  return 1;
}

export function scoreIdentification(
  response: string,
  answers: string[],
  options: { caseSensitive?: boolean; typoTolerance?: boolean } = {}
): number {
  const { caseSensitive = false, typoTolerance = false } = options;
  const clean = normalize(response, caseSensitive);
  if (!clean) return 0;

  for (const accepted of answers) {
    if (typoTolerance) {
      if (isTypoMatch(response, accepted, caseSensitive)) return 1;
    } else if (clean === normalize(accepted, caseSensitive)) {
      return 1;
    }
  }
  return 0;
}

export function scoreEnumeration(
  entries: string[],
  answers: string[],
  ordered = false,
  count?: number
): number {
  const expectedCount = count ?? answers.length;
  if (expectedCount <= 0) return 0;

  const clean = entries.map((e) => normalize(e)).filter(Boolean);
  const target = answers.map((a) => normalize(a));

  if (ordered) {
    const orderedTarget = target.slice(0, expectedCount);
    const hits = orderedTarget.filter((t, i) => clean[i] === t).length;
    return hits / expectedCount;
  }

  const pool = [...target];
  let hits = 0;
  for (const e of clean) {
    if (hits >= expectedCount) break;
    const idx = pool.indexOf(e);
    if (idx !== -1) {
      hits++;
      pool.splice(idx, 1);
    }
  }
  return Math.min(1, hits / expectedCount);
}

export function gradeQuestion(
  question: Question,
  response: UserAnswer["response"],
  options: { typoTolerance?: boolean } = {}
): { score: number; isCorrect: boolean } {
  let score = 0;

  switch (question.type) {
    case "multiple_choice": {
      const selected = Array.isArray(response)
        ? response.filter((v): v is number => typeof v === "number")
        : [];
      score = scoreMultipleChoice(
        selected,
        question.answer,
        question.multiSelect
      );
      break;
    }
    case "identification": {
      const text = typeof response === "string" ? response : "";
      score = scoreIdentification(text, question.answers, {
        caseSensitive: question.caseSensitive,
        typoTolerance: options.typoTolerance,
      });
      break;
    }
    case "enumeration": {
      const entries = Array.isArray(response)
        ? response.map((v) => String(v))
        : [];
      score = scoreEnumeration(
        entries,
        question.answers,
        question.ordered,
        question.count
      );
      break;
    }
  }

  return {
    score,
    isCorrect: score === 1,
  };
}
