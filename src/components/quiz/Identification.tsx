"use client";

import type { IdentificationQuestion } from "@/lib/types";

interface IdentificationProps {
  question: IdentificationQuestion;
  value: string;
  onChange: (value: string) => void;
  locked?: boolean;
  onEnter?: () => void;
}

export function Identification({
  question,
  value,
  onChange,
  locked = false,
  onEnter,
}: IdentificationProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={`id-input-${question.id}`}
        className="text-xs font-extrabold uppercase tracking-wider text-text-muted"
      >
        Type your answer
      </label>
      <input
        id={`id-input-${question.id}`}
        type="text"
        value={value}
        disabled={locked}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) {
            e.preventDefault();
            onEnter();
          }
        }}
        placeholder="Enter your answer..."
        autoComplete="off"
        autoFocus
        className="h-14 w-full rounded-2xl border-2 border-border bg-bg-subtle dark:bg-surface px-4 text-lg font-bold text-text placeholder:text-text-faint transition-colors focus:border-brand-fill focus:outline-none disabled:opacity-75"
      />
      {question.caseSensitive && (
        <p className="text-xs font-bold text-text-muted">
          Case-sensitive matching is enabled for this question.
        </p>
      )}
    </div>
  );
}
