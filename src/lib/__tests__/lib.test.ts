import { describe, expect, it } from "vitest";
import { convertQuestionsToMode } from "../convert";
import { isTypoMatch, normalize } from "../normalize";
import { CSV_TEMPLATE, parseCsvImport } from "../parsers/csv";
import { JSON_TEMPLATE, parseJsonImport } from "../parsers/json";
import { computeGuestMergeDiff } from "../supabase/sync";
import {
  gradeQuestion,
  scoreEnumeration,
  scoreIdentification,
  scoreMultipleChoice,
} from "../scoring";
import { remapMultipleChoice } from "../shuffle";
import type { MultipleChoiceQuestion } from "../types";

describe("normalize", () => {
  it("strips punctuation, accents, and collapses spaces", () => {
    expect(normalize("  Café   au   lait! ")).toBe("cafe au lait");
    expect(normalize("Mitochondrion.")).toBe("mitochondrion");
  });

  it("supports typo tolerance for 6+ char answers", () => {
    expect(isTypoMatch("mitocondrion", "Mitochondrion")).toBe(true);
    expect(isTypoMatch("photosintesis", "Photosynthesis")).toBe(true);
    expect(isTypoMatch("atx", "ATP")).toBe(false);
  });
});

describe("scoring", () => {
  it("scores single and multi-select multiple choice", () => {
    expect(scoreMultipleChoice([1], [1], false)).toBe(1);
    expect(scoreMultipleChoice([0], [1], false)).toBe(0);
    expect(scoreMultipleChoice([0, 2], [2, 0], true)).toBe(1);
    expect(scoreMultipleChoice([0], [0, 2], true)).toBe(0);
  });

  it("scores identification with alternate answers", () => {
    expect(
      scoreIdentification("  photosynthesis! ", ["Photosynthesis", "Calvin Cycle"])
    ).toBe(1);
    expect(scoreIdentification("respiration", ["Photosynthesis"])).toBe(0);
  });

  it("scores enumeration with partial credit and no duplicate counting", () => {
    const answers = ["Adenine", "Ribose", "Phosphate"];
    expect(scoreEnumeration(["adenine", "adenine", "ribose"], answers)).toBeCloseTo(
      2 / 3
    );
    expect(scoreEnumeration(["Phosphate", "Ribose", "Adenine"], answers, false)).toBe(1);
    expect(scoreEnumeration(["Phosphate", "Ribose", "Adenine"], answers, true)).toBeCloseTo(
      1 / 3
    );
  });

  it("grades Question union via gradeQuestion", () => {
    const res = gradeQuestion(
      {
        id: "1",
        type: "identification",
        prompt: "Powerhouse?",
        answers: ["Mitochondria"],
      },
      "mitochondria"
    );
    expect(res).toEqual({ score: 1, isCorrect: true });
  });
});

describe("shuffle & remapMultipleChoice", () => {
  it("preserves the correct choice text after remapping", () => {
    const q: MultipleChoiceQuestion = {
      id: "mc1",
      type: "multiple_choice",
      prompt: "Pick B",
      choices: ["A", "B", "C", "D"],
      answer: [1],
    };

    for (let i = 0; i < 20; i++) {
      const remapped = remapMultipleChoice(q);
      expect(remapped.choices).toHaveLength(4);
      expect(remapped.choices[remapped.answer[0]]).toBe("B");
    }
  });
});

describe("parsers", () => {
  it("parses valid JSON template", () => {
    const res = parseJsonImport(JSON_TEMPLATE);
    expect(res.errors).toHaveLength(0);
    expect(res.validQuestions).toHaveLength(3);
    expect(res.title).toBe("Biology: Cell Structure");
  });

  it("reports malformed JSON items with row numbers", () => {
    const bad = JSON.stringify({
      title: "Test",
      questions: [
        { type: "fill_blank", prompt: "Hi" },
        { type: "multiple_choice", prompt: "Pick", choices: ["Only one"], answer: [0] },
      ],
    });
    const res = parseJsonImport(bad);
    expect(res.validQuestions).toHaveLength(0);
    expect(res.errors).toHaveLength(2);
    expect(res.errors[0].message).toContain("unknown type 'fill_blank'");
  });

  it("parses valid CSV template and converts 1-based MC index to 0-based", () => {
    const res = parseCsvImport(CSV_TEMPLATE);
    expect(res.errors).toHaveLength(0);
    expect(res.validQuestions).toHaveLength(3);
    const mc = res.validQuestions[0];
    expect(mc.type).toBe("multiple_choice");
    if (mc.type === "multiple_choice") {
      expect(mc.answer).toEqual([1]);
      expect(mc.choices[mc.answer[0]]).toBe("Mitochondrion");
    }
  });
});

describe("convertQuestionsToMode", () => {
  it("converts multiple_choice to identification and identification to multiple_choice", () => {
    const sample = parseJsonImport(JSON_TEMPLATE).validQuestions;

    const asId = convertQuestionsToMode(sample, "identification");
    expect(asId.every((q) => q.type === "identification")).toBe(true);
    if (asId[0].type === "identification") {
      expect(asId[0].answers).toEqual(["Mitochondrion"]);
    }

    const asMc = convertQuestionsToMode(sample, "multiple_choice");
    expect(asMc.every((q) => q.type === "multiple_choice")).toBe(true);
    const convertedId = asMc[1];
    if (convertedId.type === "multiple_choice") {
      expect(convertedId.choices.length).toBeGreaterThanOrEqual(2);
      expect(convertedId.choices[convertedId.answer[0]]).toBe("Photosynthesis");
    }
  });
});

describe("computeGuestMergeDiff", () => {
  it("deduplicates existing cloud IDs and unions badges", () => {
    const sample = parseJsonImport(JSON_TEMPLATE).validQuestions;
    const diff = computeGuestMergeDiff(
      [{ id: "q1", title: "Cloud", createdAt: 1, questions: sample }],
      [],
      ["first_quiz"],
      [
        { id: "q1", title: "Local Dup", createdAt: 1, questions: sample },
        { id: "q2", title: "Local New", createdAt: 2, questions: sample },
      ],
      [],
      ["first_quiz", "perfect_score"]
    );

    expect(diff.setsToInsert).toHaveLength(1);
    expect(diff.setsToInsert[0].id).toBe("q2");
    expect(diff.mergedSets).toHaveLength(2);
    expect(diff.mergedBadges).toEqual(["first_quiz", "perfect_score"]);
  });
});
