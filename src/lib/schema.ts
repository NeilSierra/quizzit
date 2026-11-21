import { z } from "zod";

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_QUESTIONS = 2000;

const nonEmptyString = z.string().trim().min(1, "Must not be empty");

const baseQuestionFields = {
  id: z.string().trim().min(1).optional(),
  prompt: nonEmptyString,
  hint: z.string().trim().optional(),
  explanation: z.string().trim().optional(),
  tags: z.array(nonEmptyString).optional(),
};

export const multipleChoiceSchema = z
  .object({
    ...baseQuestionFields,
    type: z.literal("multiple_choice"),
    choices: z
      .array(nonEmptyString)
      .min(2, "Multiple choice requires at least 2 choices")
      .max(8, "Multiple choice supports at most 8 choices"),
    answer: z
      .array(z.number().int().nonnegative())
      .min(1, "Multiple choice requires at least 1 correct answer index"),
    multiSelect: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    for (const idx of val.answer) {
      if (idx >= val.choices.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Answer index ${idx} is out of bounds for ${val.choices.length} choices`,
          path: ["answer"],
        });
      }
    }
  });

export const identificationSchema = z.object({
  ...baseQuestionFields,
  type: z.literal("identification"),
  answers: z
    .array(nonEmptyString)
    .min(1, "Identification requires at least 1 accepted answer"),
  caseSensitive: z.boolean().optional(),
});

export const enumerationSchema = z
  .object({
    ...baseQuestionFields,
    type: z.literal("enumeration"),
    answers: z
      .array(nonEmptyString)
      .min(2, "Enumeration requires at least 2 answers"),
    count: z.number().int().positive().optional(),
    ordered: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.count !== undefined && val.count > val.answers.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Expected count (${val.count}) cannot exceed number of answers (${val.answers.length})`,
        path: ["count"],
      });
    }
  });

export const questionSchema = z.discriminatedUnion("type", [
  multipleChoiceSchema,
  identificationSchema,
  enumerationSchema,
]);

export const quizSetImportSchema = z.object({
  title: nonEmptyString.optional(),
  description: z.string().trim().optional(),
  questions: z
    .array(z.unknown())
    .min(1, "Questions array must contain at least 1 question")
    .max(MAX_QUESTIONS, `Maximum ${MAX_QUESTIONS} questions allowed`),
});
