"use client";

import type { EnumerationQuestion } from "@/lib/types";

interface EnumerationProps {
  question: EnumerationQuestion;
  values: string[];
  onChange: (values: string[]) => void;
  locked?: boolean;
}

export function Enumeration({
  question,
  values,
  onChange,
  locked = false,
}: EnumerationProps) {
  const expectedCount = question.count ?? question.answers.length;
  const normalizedValues = Array.from(
    { length: expectedCount },
    (_, i) => values[i] ?? ""
  );

  const updateAt = (index: number, val: string) => {
    const next = [...normalizedValues];
    next[index] = val;
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-wider text-text-muted">
          List {expectedCount} {expectedCount === 1 ? "item" : "items"}
        </span>
        <span className="text-xs font-extrabold text-brand-text">
          {question.ordered ? "Order matters" : "Any order"}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {normalizedValues.map((val, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-border bg-bg-subtle text-sm font-extrabold text-text-muted">
              {idx + 1}
            </span>
            <input
              type="text"
              value={val}
              disabled={locked}
              onChange={(e) => updateAt(idx, e.target.value)}
              placeholder={`Item ${idx + 1}...`}
              autoComplete="off"
              autoFocus={idx === 0}
              className="h-12 w-full rounded-xl border-2 border-border bg-bg-subtle dark:bg-surface px-4 text-base font-bold text-text placeholder:text-text-faint transition-colors focus:border-brand-fill focus:outline-none disabled:opacity-75"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
