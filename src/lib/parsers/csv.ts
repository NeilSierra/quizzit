import Papa from "papaparse";
import { MAX_QUESTIONS, questionSchema } from "../schema";
import type { ImportError, ImportResult, Question } from "../types";

export const CSV_TEMPLATE = [
  "type,prompt,choices,answer,explanation",
  'multiple_choice,"Which organelle produces most ATP?",Nucleus|Mitochondrion|Ribosome|Golgi,2,"Mitochondria make ATP"',
  'identification,"The process plants use to make food from sunlight",,Photosynthesis|Photosynthesis process,"Happens in chloroplasts"',
  'enumeration,"Name the parts of an ATP molecule",,Adenine|Ribose|Phosphate groups,',
].join("\n");

function generateId(index: number): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `q-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

function splitPipe(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseCsvImport(
  rawText: string,
  fallbackTitle = "Imported CSV Quiz"
): ImportResult {
  const parsed = Papa.parse<Record<string, string>>(rawText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    return {
      title: fallbackTitle,
      validQuestions: [],
      errors: parsed.errors.map((e) => ({
        row: (e.row ?? 0) + 1,
        message: `Row ${(e.row ?? 0) + 1}: ${e.message}`,
      })),
      totalRows: 0,
    };
  }

  const rows = parsed.data;
  if (rows.length > MAX_QUESTIONS) {
    return {
      title: fallbackTitle,
      validQuestions: [],
      errors: [
        {
          row: 1,
          message: `CSV contains ${rows.length} rows, which exceeds the ${MAX_QUESTIONS} question limit.`,
        },
      ],
      totalRows: rows.length,
    };
  }

  const validQuestions: Question[] = [];
  const errors: ImportError[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // +1 for 1-based, +1 for header row
    const type = (row.type ?? "").trim();
    const prompt = (row.prompt ?? "").trim();
    const hint = (row.hint ?? "").trim() || undefined;
    const explanation = (row.explanation ?? "").trim() || undefined;
    const tags = splitPipe(row.tags);

    if (
      type !== "multiple_choice" &&
      type !== "identification" &&
      type !== "enumeration"
    ) {
      errors.push({
        row: rowNum,
        message: `Row ${rowNum}: unknown type '${type}'`,
      });
      return;
    }

    let candidate: unknown;

    if (type === "multiple_choice") {
      const choices = splitPipe(row.choices);
      const answerTokens = splitPipe(row.answer);
      const parsedIndices: number[] = [];

      for (const token of answerTokens) {
        const oneBased = Number(token);
        if (!Number.isInteger(oneBased) || oneBased < 1) {
          errors.push({
            row: rowNum,
            message: `Row ${rowNum}: invalid 1-based answer index '${token}'`,
          });
          return;
        }
        parsedIndices.push(oneBased - 1);
      }

      candidate = {
        type: "multiple_choice",
        prompt,
        choices,
        answer: parsedIndices,
        multiSelect: parsedIndices.length > 1 || undefined,
        hint,
        explanation,
        tags: tags.length > 0 ? tags : undefined,
      };
    } else if (type === "identification") {
      const answers = splitPipe(row.answer);
      candidate = {
        type: "identification",
        prompt,
        answers,
        hint,
        explanation,
        tags: tags.length > 0 ? tags : undefined,
      };
    } else {
      const answers = splitPipe(row.answer);
      const ordered = (row.ordered ?? "").trim().toLowerCase() === "true";
      candidate = {
        type: "enumeration",
        prompt,
        answers,
        ordered: ordered || undefined,
        hint,
        explanation,
        tags: tags.length > 0 ? tags : undefined,
      };
    }

    const res = questionSchema.safeParse(candidate);
    if (!res.success) {
      const firstIssue = res.error.issues[0];
      errors.push({
        row: rowNum,
        message: `Row ${rowNum}: ${firstIssue?.message ?? "Invalid row"}`,
      });
      return;
    }

    validQuestions.push({
      ...res.data,
      id: generateId(idx),
    });
  });

  return {
    title: fallbackTitle,
    validQuestions,
    errors,
    totalRows: rows.length,
  };
}
