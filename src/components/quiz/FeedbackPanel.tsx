"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Question, UserAnswer } from "@/lib/types";

interface FeedbackPanelProps {
  question: Question;
  answer: UserAnswer;
  isLast: boolean;
  onContinue: () => void;
}

function formatCorrectAnswer(q: Question): string {
  switch (q.type) {
    case "multiple_choice":
      return q.answer.map((i) => q.choices[i]).join(", ");
    case "identification":
      return q.answers[0];
    case "enumeration":
      return q.answers.join(", ");
  }
}

export function FeedbackPanel({
  question,
  answer,
  isLast,
  onContinue,
}: FeedbackPanelProps) {
  const isPartial = !answer.isCorrect && answer.score > 0;

  return (
    <motion.div
      initial={{ y: 64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 bottom-0 z-40 border-t-2 px-4 py-5 sm:py-6 ${
        answer.isCorrect
          ? "border-success bg-success-bg"
          : "border-danger bg-danger-bg"
      }`}
    >
      <div className="mx-auto flex max-w-[600px] flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <motion.img
            src={
              answer.isCorrect ? "/mascot/thumbs-up.png" : "/mascot/sad.png"
            }
            alt=""
            initial={
              answer.isCorrect
                ? { scale: 0.4, rotate: -14, opacity: 0 }
                : { x: 0, opacity: 0 }
            }
            animate={
              answer.isCorrect
                ? { scale: 1, rotate: 0, opacity: 1 }
                : { x: [0, -6, 6, -4, 4, 0], opacity: 1 }
            }
            transition={{
              type: "spring",
              stiffness: 460,
              damping: 18,
              delay: 0.05,
            }}
            className="h-14 w-14 shrink-0 object-contain"
          />
          <div className="flex flex-col gap-1">
            <h3
              className={`flex items-center gap-2 text-xl font-extrabold ${
                answer.isCorrect ? "text-success" : "text-danger"
              }`}
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 550,
                  damping: 18,
                  delay: 0.08,
                }}
              >
                {answer.isCorrect ? (
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 text-success"
                    strokeWidth={2.5}
                  />
                ) : (
                  <XCircle
                    className="h-5 w-5 shrink-0 text-danger"
                    strokeWidth={2.5}
                  />
                )}
              </motion.span>
              <span>
                {answer.isCorrect
                  ? "Nice work!"
                  : isPartial
                  ? `Almost! (${Math.round(answer.score * 100)}% partial credit)`
                  : "Oops, not quite."}
              </span>
            </h3>
            {!answer.isCorrect && (
              <p className="text-sm font-bold text-text">
                Correct answer:{" "}
                <span className="font-extrabold">
                  {formatCorrectAnswer(question)}
                </span>
              </p>
            )}
            {question.explanation && (
              <p className="text-sm font-semibold text-text-muted">
                {question.explanation}
              </p>
            )}
          </div>
        </div>

        <Button
          variant={answer.isCorrect ? "success" : "danger"}
          onClick={onContinue}
          className="w-full sm:w-auto shrink-0"
        >
          {isLast ? "Finish" : "Continue"}
        </Button>
      </div>
    </motion.div>
  );
}
