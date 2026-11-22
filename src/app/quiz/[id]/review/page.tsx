"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { QuestionTypeIcon } from "@/components/QuestionTypeIcon";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { sound } from "@/lib/sound";
import type { Question, UserAnswer } from "@/lib/types";
import { useQuizSession } from "@/store/useQuizSession";

function formatUserResponse(q: Question, ans: UserAnswer | undefined): string {
  if (!ans) return "(No answer)";
  if (q.type === "multiple_choice") {
    const sel = Array.isArray(ans.response) ? (ans.response as number[]) : [];
    if (sel.length === 0) return "(No answer)";
    return sel.map((i) => q.choices[i] ?? `Option ${i + 1}`).join(", ");
  }
  if (q.type === "identification") {
    return typeof ans.response === "string" && ans.response.trim()
      ? ans.response
      : "(No answer)";
  }
  const entries = Array.isArray(ans.response)
    ? (ans.response as string[]).filter((s) => s.trim())
    : [];
  return entries.length > 0 ? entries.join(", ") : "(No answer)";
}

function formatExpectedAnswer(q: Question): string {
  if (q.type === "multiple_choice") {
    return q.answer.map((i) => q.choices[i]).join(", ");
  }
  if (q.type === "identification") {
    return q.answers.join(" / ");
  }
  return q.answers.join(", ");
}

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const lastCompleted = useQuizSession((s) => s.lastCompleted);
  const [filter, setFilter] = useState<"all" | "mistakes">("all");

  if (!lastCompleted) {
    return (
      <div className="mx-auto max-w-md py-16 text-center flex flex-col items-center gap-4">
        <h1 className="text-2xl font-extrabold text-text">
          Nothing to review yet
        </h1>
        <Link href={`/quiz/${id}/setup`}>
          <Button variant="primary">Start Quiz</Button>
        </Link>
      </div>
    );
  }

  const { attempt, questions } = lastCompleted;
  const answerMap = new Map(attempt.answers.map((a) => [a.questionId, a]));

  const visibleQuestions =
    filter === "mistakes"
      ? questions.filter((q) => !answerMap.get(q.id)?.isCorrect)
      : questions;

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/quiz/${id}/results`}
            aria-label="Back to results"
            className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-surface text-text-muted hover:text-text"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-text whitespace-nowrap">Answer Review</h1>
            <p className="text-sm font-semibold text-text-muted truncate">
              {attempt.quizTitle} &bull; {attempt.accuracy}%
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setFilter("all");
            }}
            className={`focus-ring rounded-xl border-2 px-3 py-1.5 text-sm font-extrabold ${
              filter === "all"
                ? "border-brand-fill bg-brand-tint text-brand-text"
                : "border-border bg-surface text-text-muted"
            }`}
          >
            All ({questions.length})
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setFilter("mistakes");
            }}
            className={`focus-ring rounded-xl border-2 px-3 py-1.5 text-sm font-extrabold ${
              filter === "mistakes"
                ? "border-brand-fill bg-brand-tint text-brand-text"
                : "border-border bg-surface text-text-muted"
            }`}
          >
            Mistakes (
            {questions.filter((q) => !answerMap.get(q.id)?.isCorrect).length})
          </button>
        </div>
      </div>

      {visibleQuestions.length === 0 ? (
        <Card className="py-10 text-center">
          <p className="text-lg font-extrabold text-success">
            Zero mistakes! You answered every question correctly.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {visibleQuestions.map((q, idx) => {
            const ans = answerMap.get(q.id);
            const isCorrect = Boolean(ans?.isCorrect);
            return (
              <Card
                key={q.id}
                className={`flex flex-col gap-3 ${
                  isCorrect ? "border-success/60" : "border-danger/60"
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-bg-subtle px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
                      <QuestionTypeIcon type={q.type} className="h-3 w-3 shrink-0" />
                      <span>{q.type.replace("_", " ")}</span>
                    </span>
                    {ans && !ans.isCorrect && ans.score > 0 && (
                      <span className="shrink-0 whitespace-nowrap rounded-full bg-brand-tint px-2.5 py-0.5 text-xs font-extrabold text-brand-text">
                        {Math.round(ans.score * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-2.5">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-success mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-danger mt-0.5" />
                    )}
                    <h2 className="text-base sm:text-lg font-extrabold text-text break-words">
                      {idx + 1}. {q.prompt}
                    </h2>
                  </div>
                </div>

                <div className="rounded-xl bg-bg-subtle p-3.5 text-sm space-y-1.5">
                  <div>
                    <span className="font-bold text-text-muted">
                      Your answer:{" "}
                    </span>
                    <span
                      className={`font-extrabold ${
                        isCorrect ? "text-success" : "text-danger"
                      }`}
                    >
                      {formatUserResponse(q, ans)}
                    </span>
                  </div>
                  {!isCorrect && (
                    <div>
                      <span className="font-bold text-text-muted">
                        Correct answer:{" "}
                      </span>
                      <span className="font-extrabold text-success">
                        {formatExpectedAnswer(q)}
                      </span>
                    </div>
                  )}
                  {q.explanation && (
                    <p className="pt-1 text-text-muted font-semibold">
                      {q.explanation}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
