import { MAX_QUESTIONS, questionSchema } from "../schema";
import type { ImportError, ImportResult, Question } from "../types";

export const JSON_TEMPLATE = JSON.stringify(
  {
    title: "Biology: Cell Structure",
    description: "Chapter 3 review",
    questions: [
      {
        type: "multiple_choice",
        prompt: "Which organelle produces most of the cell's ATP?",
        choices: ["Nucleus", "Mitochondrion", "Ribosome", "Golgi apparatus"],
        answer: [1],
        explanation: "Mitochondria carry out oxidative phosphorylation.",
      },
      {
        type: "identification",
        prompt: "The process by which plants make food using sunlight.",
        answers: ["Photosynthesis"],
        explanation: "Occurs in the chloroplasts.",
      },
      {
        type: "enumeration",
        prompt: "Name the three parts of an ATP molecule.",
        answers: ["Adenine", "Ribose", "Three phosphate groups"],
        ordered: false,
      },
    ],
  },
  null,
  2
);

export const SAMPLE_QUIZ_JSON = JSON.stringify(
  {
    title: "Quick Start: Easy Trivia",
    description: "Easy sample quiz showcasing all question types, hints, and mode conversion",
    questions: [
      {
        type: "multiple_choice",
        prompt: "What color do you get when you mix red and yellow?",
        choices: ["Green", "Orange", "Purple", "Blue"],
        answer: [1],
        hint: "Think of the color of a carrot or a basketball.",
        explanation: "Mixing red and yellow creates orange.",
      },
      {
        type: "identification",
        prompt: "What planet is closest to the Sun?",
        answers: ["Mercury"],
        hint: "It is the smallest planet in our solar system and starts with M.",
        explanation: "Mercury is the innermost planet in our solar system.",
      },
      {
        type: "enumeration",
        prompt: "Name the three traditional primary colors in painting.",
        answers: ["Red", "Yellow", "Blue"],
        ordered: false,
        hint: "Think of a strawberry, a banana, and the sky.",
        explanation: "Red, yellow, and blue are the three traditional primary colors.",
      },
      {
        type: "multiple_choice",
        prompt: "Which of the following are fruits?",
        choices: ["Apple", "Carrot", "Banana", "Potato"],
        answer: [0, 2],
        multiSelect: true,
        hint: "Two of these grow underground as root vegetables.",
        explanation: "Apples and bananas are fruits, while carrots and potatoes are root vegetables.",
      },
      {
        type: "identification",
        prompt: "How many days are there in one week?",
        answers: ["7", "Seven"],
        hint: "Count from Monday through Sunday.",
        explanation: "There are 7 days in a week.",
      },
    ],
  },
  null,
  2
);

function generateId(index: number): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `q-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

export function parseJsonImport(
  rawText: string,
  fallbackTitle = "Imported Quiz"
): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    return {
      title: fallbackTitle,
      validQuestions: [],
      errors: [
        {
          row: 1,
          message: `Invalid JSON syntax: ${err instanceof Error ? err.message : "Unable to parse"}`,
        },
      ],
      totalRows: 0,
    };
  }

  let title = fallbackTitle;
  let description: string | undefined;
  let rawQuestions: unknown[];

  if (Array.isArray(parsed)) {
    rawQuestions = parsed;
  } else if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.title === "string" && obj.title.trim()) {
      title = obj.title.trim();
    }
    if (typeof obj.description === "string" && obj.description.trim()) {
      description = obj.description.trim();
    }
    if (!Array.isArray(obj.questions)) {
      return {
        title,
        description,
        validQuestions: [],
        errors: [
          {
            row: 1,
            message: 'JSON object must contain a "questions" array.',
          },
        ],
        totalRows: 0,
      };
    }
    rawQuestions = obj.questions;
  } else {
    return {
      title,
      validQuestions: [],
      errors: [
        {
          row: 1,
          message: "JSON root must be an object with a questions array or an array of questions.",
        },
      ],
      totalRows: 0,
    };
  }

  if (rawQuestions.length > MAX_QUESTIONS) {
    return {
      title,
      description,
      validQuestions: [],
      errors: [
        {
          row: 1,
          message: `File contains ${rawQuestions.length} questions, which exceeds the ${MAX_QUESTIONS} question limit.`,
        },
      ],
      totalRows: rawQuestions.length,
    };
  }

  const validQuestions: Question[] = [];
  const errors: ImportError[] = [];

  rawQuestions.forEach((item, idx) => {
    const rowNum = idx + 1;
    if (!item || typeof item !== "object") {
      errors.push({ row: rowNum, message: `Item ${rowNum}: expected an object.` });
      return;
    }

    const rawType = (item as Record<string, unknown>).type;
    if (
      rawType !== "multiple_choice" &&
      rawType !== "identification" &&
      rawType !== "enumeration"
    ) {
      errors.push({
        row: rowNum,
        message: `Item ${rowNum}: unknown type '${String(rawType ?? "")}'`,
      });
      return;
    }

    const res = questionSchema.safeParse(item);
    if (!res.success) {
      const firstIssue = res.error.issues[0];
      errors.push({
        row: rowNum,
        message: `Item ${rowNum}: ${firstIssue?.message ?? "Invalid question format"}`,
      });
      return;
    }

    const data = res.data;
    validQuestions.push({
      ...data,
      id: data.id ?? generateId(idx),
    });
  });

  return {
    title,
    description,
    validQuestions,
    errors,
    totalRows: rawQuestions.length,
  };
}
