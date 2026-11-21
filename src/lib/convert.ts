import { normalize } from "./normalize";
import { shuffle } from "./shuffle";
import type {
  MultipleChoiceQuestion,
  Question,
  QuestionType,
} from "./types";

function extractAnswerPool(questions: Question[]): string[] {
  const seen = new Set<string>();
  const pool: string[] = [];

  const add = (val: string) => {
    const trimmed = val.trim();
    const norm = normalize(trimmed);
    if (!trimmed || !norm || seen.has(norm)) return;
    seen.add(norm);
    pool.push(trimmed);
  };

  for (const q of questions) {
    if (q.type === "multiple_choice") {
      for (const idx of q.answer) {
        if (q.choices[idx]) add(q.choices[idx]);
      }
      for (const c of q.choices) add(c);
    } else if (q.type === "identification") {
      if (q.answers[0]) add(q.answers[0]);
    } else if (q.type === "enumeration") {
      for (const a of q.answers) add(a);
    }
  }

  return pool;
}

function pickDistractors(
  pool: string[],
  exclude: string[],
  needed: number
): string[] {
  const excludedNorms = new Set(exclude.map((e) => normalize(e)));
  const candidates = pool.filter((item) => !excludedNorms.has(normalize(item)));
  return shuffle(candidates).slice(0, needed);
}

export function convertQuestion(
  q: Question,
  targetMode: QuestionType,
  allQuestions: Question[],
  answerPool?: string[]
): Question {
  if (q.type === targetMode) return q;

  const pool = answerPool ?? extractAnswerPool(allQuestions);
  const base = {
    id: q.id,
    prompt: q.prompt,
    hint: q.hint,
    explanation: q.explanation,
    tags: q.tags,
  };

  if (targetMode === "identification") {
    if (q.type === "multiple_choice") {
      const correctTexts = q.answer
        .map((i) => q.choices[i])
        .filter(Boolean);
      if (correctTexts.length === 1) {
        return {
          ...base,
          type: "identification",
          answers: [correctTexts[0]],
        };
      }
      if (correctTexts.length > 1) {
        return {
          ...base,
          type: "identification",
          answers: [correctTexts.join(", ")],
        };
      }
    }
    if (q.type === "enumeration") {
      return {
        ...base,
        type: "identification",
        answers: [q.answers.join(", ")],
      };
    }
  }

  if (targetMode === "multiple_choice") {
    if (q.type === "identification") {
      const correct = q.answers[0];
      const distractors = pickDistractors(pool, q.answers, 3);
      if (distractors.length === 0) return q;
      const combined = shuffle([correct, ...distractors]);
      const answerIdx = combined.indexOf(correct);
      const mc: MultipleChoiceQuestion = {
        ...base,
        type: "multiple_choice",
        choices: combined,
        answer: [answerIdx],
      };
      return mc;
    }
    if (q.type === "enumeration") {
      const correctItems = q.answers.slice(0, 5);
      const maxDistractors = Math.min(3, 8 - correctItems.length);
      const distractors = pickDistractors(pool, q.answers, maxDistractors);
      if (distractors.length === 0) return q;
      const combined = shuffle([...correctItems, ...distractors]);
      const correctNorms = new Set(correctItems.map((c) => normalize(c)));
      const answerIndices = combined
        .map((item, idx) => (correctNorms.has(normalize(item)) ? idx : -1))
        .filter((idx) => idx !== -1);
      return {
        ...base,
        type: "multiple_choice",
        choices: combined,
        answer: answerIndices,
        multiSelect: answerIndices.length > 1,
      };
    }
  }

  if (targetMode === "enumeration") {
    if (q.type === "multiple_choice" && q.answer.length >= 2) {
      return {
        ...base,
        type: "enumeration",
        answers: q.answer.map((i) => q.choices[i]).filter(Boolean),
        ordered: false,
      };
    }
  }

  return q;
}

export function convertQuestionsToMode(
  questions: Question[],
  targetMode: QuestionType
): Question[] {
  const pool = extractAnswerPool(questions);
  return questions.map((q) => convertQuestion(q, targetMode, questions, pool));
}
