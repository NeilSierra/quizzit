"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import type { MultipleChoiceQuestion } from "@/lib/types";

interface MultipleChoiceProps {
  question: MultipleChoiceQuestion;
  selected: number[];
  onChange: (next: number[]) => void;
  locked?: boolean;
  showFeedback?: boolean;
  eliminatedIndices?: number[];
}

export function MultipleChoice({
  question,
  selected,
  onChange,
  locked = false,
  showFeedback = false,
  eliminatedIndices = [],
}: MultipleChoiceProps) {
  const toggleChoice = (idx: number) => {
    if (locked || eliminatedIndices.includes(idx)) return;
    if (question.multiSelect) {
      if (selected.includes(idx)) {
        onChange(selected.filter((i) => i !== idx));
      } else {
        onChange([...selected, idx]);
      }
    } else {
      onChange([idx]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {question.multiSelect && (
        <p className="text-xs font-extrabold uppercase tracking-wider text-brand-text">
          Select all that apply
        </p>
      )}
      <div
        role={question.multiSelect ? "group" : "radiogroup"}
        aria-label={question.prompt}
        className="flex flex-col gap-3"
      >
        {question.choices.map((choice, idx) => {
          const isSelected = selected.includes(idx);
          const isCorrectChoice = question.answer.includes(idx);
          const isEliminated = eliminatedIndices.includes(idx) && !showFeedback;

          let cardStyle =
            "border-border bg-surface text-text shadow-[0_2px_0_var(--border)] hover:border-border-strong";
          let badgeStyle = "border-border text-text-muted bg-bg-subtle";

          if (showFeedback) {
            if (isCorrectChoice) {
              cardStyle =
                "border-success bg-success-bg text-text shadow-[0_2px_0_var(--success)]";
              badgeStyle = "border-success bg-success text-white";
            } else if (isSelected && !isCorrectChoice) {
              cardStyle =
                "border-danger bg-danger-bg text-text shadow-[0_2px_0_var(--danger)]";
              badgeStyle = "border-danger bg-danger text-white";
            }
          } else if (isEliminated) {
            cardStyle =
              "border-border bg-disabled-bg text-text-faint opacity-50 line-through";
            badgeStyle = "border-border text-text-faint bg-disabled-bg";
          } else if (isSelected) {
            cardStyle =
              "border-brand-fill bg-brand-tint text-text shadow-[0_2px_0_var(--brand-fill)]";
            badgeStyle = "border-brand-fill bg-brand-fill text-white";
          }

          return (
            <motion.button
              key={idx}
              type="button"
              disabled={locked || isEliminated}
              role={question.multiSelect ? "checkbox" : "radio"}
              aria-checked={isSelected}
              onClick={() => toggleChoice(idx)}
              whileTap={
                locked || isEliminated ? undefined : { scale: 0.98 }
              }
              animate={
                showFeedback && isCorrectChoice
                  ? { scale: [1, 1.03, 1] }
                  : showFeedback && isSelected && !isCorrectChoice
                  ? { x: [0, -7, 7, -4, 4, 0] }
                  : { scale: 1, x: 0 }
              }
              transition={{
                type: "spring",
                stiffness: 560,
                damping: 26,
                duration: 0.24,
              }}
              className={`focus-ring flex min-h-16 w-full items-center gap-4 rounded-2xl border-2 px-5 py-3.5 text-left transition-colors duration-100 ${cardStyle} ${
                locked || isEliminated ? "cursor-default" : "cursor-pointer"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-extrabold ${badgeStyle}`}
              >
                {showFeedback && isCorrectChoice ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : showFeedback && isSelected && !isCorrectChoice ? (
                  <X className="h-4 w-4" strokeWidth={3} />
                ) : (
                  idx + 1
                )}
              </span>
              <span className="text-base sm:text-lg font-bold leading-snug">
                {choice}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
