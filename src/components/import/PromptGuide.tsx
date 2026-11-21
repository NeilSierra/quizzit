"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QuestionTypeIcon } from "@/components/QuestionTypeIcon";
import { sound } from "@/lib/sound";
import type { QuestionType } from "@/lib/types";

const TYPE_OPTIONS: { id: QuestionType; label: string }[] = [
  { id: "multiple_choice", label: "Multiple Choice" },
  { id: "identification", label: "Identification" },
  { id: "enumeration", label: "Enumeration" },
];

function buildPrompt(
  format: "json" | "csv",
  types: QuestionType[],
  countMode: "max" | "custom",
  count: number,
  notes: string
): string {
  const typeNames = types.map((t) => t.replace("_", " ")).join(", ");
  const countInstruction =
    countMode === "max"
      ? "as many high-quality questions as possible (covering all key concepts, facts, and details—up to 2,000)"
      : `a ${count}-question quiz`;

  const sourceBlock = notes.trim()
    ? `Base the quiz on any files/materials I uploaded or attached in this chat (PDFs, PowerPoint/PPT/PPTX slides, documents, images, etc.) AND the following topic/notes:\n"""\n${notes.trim()}\n"""`
    : `Base the quiz on all materials I have uploaded or attached in this chat (PDFs, PowerPoint/PPT/PPTX slides, documents, handouts, images, or notes).\n(If no files are attached, use this topic/notes: [PASTE YOUR TOPIC OR STUDY NOTES HERE])`;

  if (format === "json") {
    const schemaParts: string[] = [];
    if (types.includes("multiple_choice")) {
      schemaParts.push(
        `- "multiple_choice": { "type": "multiple_choice", "prompt": "...", "choices": ["A", "B", "C", "D"], "answer": [1], "hint": "Optional hint", "explanation": "..." } (2 to 8 choices; "answer" is an array of 0-based indices)`
      );
    }
    if (types.includes("identification")) {
      schemaParts.push(
        `- "identification": { "type": "identification", "prompt": "...", "answers": ["Main Answer", "Alternate"], "hint": "Optional hint", "explanation": "..." } (at least 1 accepted answer)`
      );
    }
    if (types.includes("enumeration")) {
      schemaParts.push(
        `- "enumeration": { "type": "enumeration", "prompt": "...", "answers": ["Item 1", "Item 2", "Item 3"], "ordered": false, "hint": "Optional hint", "explanation": "..." } (at least 2 answers)`
      );
    }

    return [
      `Create ${countInstruction} in valid JSON format for Quizzit.`,
      `Include these question types: ${typeNames}.`,
      "",
      sourceBlock,
      "",
      "Follow this exact JSON structure:",
      "{",
      '  "title": "Short Quiz Title",',
      '  "description": "Brief description",',
      '  "questions": [ ... ]',
      "}",
      "",
      "Question schemas:",
      ...schemaParts,
      "",
      "Rules:",
      ...(types.includes("multiple_choice")
        ? [
            "- For multiple choice, make wrong choices plausible, closely related to the topic, and similar in length and style to the correct answer (avoid obviously silly or unrelated distractors).",
          ]
        : []),
      "- Make the output a downloadable .json file (e.g. quiz.json), or return ONLY valid JSON inside a single code block if file download is not available, with no extra commentary.",
      "- Every question must have a non-empty prompt and a helpful explanation.",
    ].join("\n");
  }

  const csvNotes: string[] = [];
  if (types.includes("multiple_choice")) {
    csvNotes.push(
      `- multiple_choice: "choices" is |-separated (2-8 options). "answer" is 1-based index (e.g. 2 or 1|3 for multi-select). Make wrong choices plausible, closely related to the topic, and similar in length/style to the correct answer.`
    );
  }
  if (types.includes("identification")) {
    csvNotes.push(
      `- identification: leave "choices" empty. "answer" is |-separated accepted answers (e.g. Photosynthesis|Photosynthesis process).`
    );
  }
  if (types.includes("enumeration")) {
    csvNotes.push(
      `- enumeration: leave "choices" empty. "answer" is |-separated list of 2+ items (e.g. Adenine|Ribose|Phosphate groups).`
    );
  }

  return [
    `Create ${countInstruction} in valid CSV format for Quizzit.`,
    `Include these question types: ${typeNames}.`,
    "",
    sourceBlock,
    "",
    "Use this exact CSV header:",
    "type,prompt,choices,answer,explanation",
    "",
    "Column rules:",
    ...csvNotes,
    '- Wrap any cell containing commas or quotes in double quotes ("...").',
    "- Make the output a downloadable .csv file (e.g. quiz.csv), or return ONLY the raw CSV inside a single code block if file download is not available, with no extra commentary.",
  ].join("\n");
}

export function PromptGuide() {
  const [format, setFormat] = useState<"json" | "csv">("csv");
  const [types, setTypes] = useState<QuestionType[]>([
    "multiple_choice",
    "identification",
    "enumeration",
  ]);
  const [countMode, setCountMode] = useState<"max" | "custom">("max");
  const [count, setCount] = useState(15);
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  const toggleType = (id: QuestionType) => {
    sound.playClick();
    setTypes((prev) => {
      if (prev.includes(id)) {
        return prev.length === 1 ? prev : prev.filter((t) => t !== id);
      }
      return [...prev, id];
    });
  };

  const promptText = useMemo(
    () => buildPrompt(format, types, countMode, Math.max(1, count), notes),
    [format, types, countMode, count, notes]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand-text">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-text">
            AI Prompt Guide
          </h2>
          <p className="text-sm font-semibold text-text-muted">
            Copy this prompt into ChatGPT, Gemini, or Claude along with your
            uploaded PDFs, PowerPoint slides, or study notes.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-text-muted">
              Output Format
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(["csv", "json"] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setFormat(fmt);
                  }}
                  className={`focus-ring h-10 rounded-xl border-2 px-3 text-sm font-extrabold uppercase transition-colors ${
                    format === fmt
                      ? "border-brand-fill bg-brand-tint text-brand-text"
                      : "border-border bg-surface text-text-muted hover:border-border-strong"
                  }`}
                >
                  {fmt === "csv" ? "CSV (Default)" : "JSON"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-text-muted">
              Number of Questions
            </span>
            <div className="grid grid-cols-[1fr_1fr_4.5rem] items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setCountMode("max");
                }}
                className={`focus-ring h-10 rounded-xl border-2 px-2.5 text-xs font-extrabold uppercase tracking-wide whitespace-nowrap transition-colors ${
                  countMode === "max"
                    ? "border-brand-fill bg-brand-tint text-brand-text"
                    : "border-border bg-surface text-text-muted hover:border-border-strong"
                }`}
              >
                Max
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setCountMode("custom");
                }}
                className={`focus-ring h-10 rounded-xl border-2 px-2.5 text-xs font-extrabold uppercase tracking-wide whitespace-nowrap transition-colors ${
                  countMode === "custom"
                    ? "border-brand-fill bg-brand-tint text-brand-text"
                    : "border-border bg-surface text-text-muted hover:border-border-strong"
                }`}
              >
                Custom
              </button>
              <input
                id="prompt-count"
                type="number"
                min={1}
                max={2000}
                disabled={countMode === "max"}
                aria-label="Custom number of questions"
                value={count}
                onChange={(e) => setCount(Number(e.target.value) || 1)}
                className="h-10 w-full rounded-xl border-2 border-border bg-bg-subtle dark:bg-surface px-2 text-center font-extrabold text-text focus:border-brand-fill focus:outline-none disabled:bg-disabled-bg disabled:text-text-faint disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-extrabold uppercase tracking-wider text-text-muted">
            Question Types
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3 gap-2">
            {TYPE_OPTIONS.map((opt) => {
              const active = types.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleType(opt.id)}
                  className={`focus-ring flex h-10 items-center justify-center gap-2 rounded-xl border-2 px-3 text-xs font-extrabold uppercase tracking-wide transition-colors ${
                    active
                      ? "border-brand-fill bg-brand-tint text-brand-text"
                      : "border-border bg-surface text-text-muted hover:border-border-strong"
                  }`}
                >
                  <QuestionTypeIcon type={opt.id} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="prompt-notes"
          className="text-xs font-extrabold uppercase tracking-wider text-text-muted"
        >
          Extra Topic or Study Notes (Optional)
        </label>
        <textarea
          id="prompt-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional: paste notes here, or leave blank if you're uploading PDFs/PPTs directly in the AI chatbot..."
          className="w-full rounded-xl border-2 border-border bg-bg-subtle dark:bg-surface p-3 text-sm font-semibold text-text placeholder:text-text-faint focus:border-brand-fill focus:outline-none"
        />
      </div>

      {/* Prompt Preview */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-text-muted">
            Generated Prompt
          </span>
          <Button variant="primary" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Prompt
              </>
            )}
          </Button>
        </div>
        <pre className="max-h-64 max-w-full overflow-x-auto overflow-y-auto rounded-2xl border-2 border-border bg-bg-subtle p-3 sm:p-4 font-mono text-xs leading-relaxed text-text whitespace-pre-wrap break-words">
          {promptText}
        </pre>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 pt-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-text-muted mr-1">
            Open AI Chatbot:
          </span>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            {[
              { name: "ChatGPT", url: "https://chatgpt.com" },
              { name: "Gemini", url: "https://gemini.google.com" },
              { name: "Claude", url: "https://claude.ai" },
              { name: "DeepSeek", url: "https://chat.deepseek.com" },
            ].map((bot) => (
              <a
                key={bot.name}
                href={bot.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.playClick()}
                className="focus-ring inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border-2 border-border bg-surface px-3 py-1.5 text-xs font-extrabold text-brand-text shadow-[0_2px_0_var(--border)] hover:border-brand-fill hover:bg-brand-tint transition-colors"
              >
                <span>{bot.name}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Collapsible Manual Format Cheat-Sheet */}
      <div className="border-t-2 border-border pt-3">
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setShowCheatSheet((v) => !v);
          }}
          className="focus-ring flex w-full items-center justify-between rounded-xl py-1 text-sm font-extrabold text-brand-text"
        >
          <span>Manual Format Cheat-Sheet</span>
          {showCheatSheet ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {showCheatSheet && (
          <div className="mt-3 rounded-xl bg-bg-subtle p-4 text-xs font-semibold text-text-muted space-y-2">
            <p>
              <strong className="text-text">Multiple Choice:</strong> 2–8
              choices. In JSON, <code className="font-mono">answer</code> is{" "}
              <strong className="text-text">0-based</strong> (e.g.{" "}
              <code className="font-mono">[0]</code>). In CSV,{" "}
              <code className="font-mono">answer</code> is{" "}
              <strong className="text-text">1-based</strong> (e.g.{" "}
              <code className="font-mono">1</code> or{" "}
              <code className="font-mono">1|3</code>).
            </p>
            <p>
              <strong className="text-text">Identification:</strong> At least 1
              accepted answer. Separate multiple accepted answers with{" "}
              <code className="font-mono">|</code> in CSV or an array in JSON.
            </p>
            <p>
              <strong className="text-text">Enumeration:</strong> At least 2
              items. Separate items with <code className="font-mono">|</code> in
              CSV or an array in JSON.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
