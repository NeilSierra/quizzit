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
    title: "Biology: Cell Structure & Energy",
    description: "Sample quiz showcasing all question types, hints, and mode conversion",
    questions: [
      {
        type: "multiple_choice",
        prompt: "Which organelle produces most of the cell's ATP?",
        choices: ["Nucleus", "Mitochondrion", "Ribosome", "Golgi apparatus"],
        answer: [1],
        hint: "Often called the powerhouse of the cell.",
        explanation: "Mitochondria carry out oxidative phosphorylation to generate ATP.",
      },
      {
        type: "identification",
        prompt: "The process by which plants convert sunlight into chemical energy.",
        answers: ["Photosynthesis"],
        hint: "Takes place inside chloroplasts.",
        explanation: "Photosynthesis uses light, water, and CO₂ to produce glucose and oxygen.",
      },
      {
        type: "enumeration",
        prompt: "Name the three main parts of an ATP molecule.",
        answers: ["Adenine", "Ribose", "Three phosphate groups"],
        ordered: false,
        hint: "A nitrogenous base, a 5-carbon sugar, and phosphate groups.",
        explanation: "ATP stands for adenosine triphosphate.",
      },
      {
        type: "multiple_choice",
        prompt: "Which structures are found in plant cells but NOT in animal cells?",
        choices: ["Cell wall", "Mitochondria", "Chloroplasts", "Ribosomes"],
        answer: [0, 2],
        multiSelect: true,
        hint: "Think about rigidity and photosynthesis.",
        explanation: "Plant cells have a rigid cell wall and chloroplasts for photosynthesis.",
      },
      {
        type: "identification",
        prompt: "Which organelle synthesizes proteins by translating mRNA?",
        answers: ["Ribosome", "Ribosomes"],
        hint: "Found both free in the cytoplasm and on rough ER.",
        explanation: "Ribosomes link amino acids together according to mRNA codons.",
      },
      {
        type: "multiple_choice",
        prompt: "What controls what enters and leaves the cell?",
        choices: ["Plasma membrane", "Cytoplasm", "Nucleolus", "Lysosome"],
        answer: [0],
        hint: "A selectively permeable phospholipid bilayer.",
        explanation: "The plasma membrane regulates transport into and out of the cell.",
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
