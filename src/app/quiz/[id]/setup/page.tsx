"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Layers, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { QuestionTypeIcon } from "@/components/QuestionTypeIcon";
import { sound } from "@/lib/sound";
import type { QuestionType, QuizSettings } from "@/lib/types";
import { useLibrary } from "@/store/useLibrary";
import { useQuizSession } from "@/store/useQuizSession";

const TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Multiple Choice",
  identification: "Identification",
  enumeration: "Enumeration",
};

export default function QuizSetupPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const quizSets = useLibrary((s) => s.quizSets);
  const attempts = useLibrary((s) => s.attempts);
  const hydrated = useLibrary((s) => s.hydrated);
  const startSession = useQuizSession((s) => s.startSession);

  const quizSet = useMemo(
    () => quizSets.find((q) => q.id === id),
    [quizSets, id]
  );

  const typeCounts = useMemo(() => {
    const counts: Record<QuestionType, number> = {
      multiple_choice: 0,
      identification: 0,
      enumeration: 0,
    };
    if (!quizSet) return counts;
    for (const q of quizSet.questions) {
      counts[q.type] += 1;
    }
    return counts;
  }, [quizSet]);

  const availableTypes = useMemo(
    () =>
      (["multiple_choice", "identification", "enumeration"] as QuestionType[]).filter(
        (t) => typeCounts[t] > 0
      ),
    [typeCounts]
  );

  const [targetMode, setTargetMode] = useState<"original" | QuestionType>("original");
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[] | null>(null);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleChoices, setShuffleChoices] = useState(true);
  const [feedbackMode, setFeedbackMode] = useState<"immediate" | "end">(
    "immediate"
  );
  const [countMode, setCountMode] = useState<"all" | "custom">("all");
  const [customCount, setCustomCount] = useState(10);
  const [useTimer, setUseTimer] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(10);
  const [typoTolerance, setTypoTolerance] = useState(true);
  const [unquizzedOnly, setUnquizzedOnly] = useState(false);

  const unquizzedQuestions = useMemo(() => {
    if (!quizSet) return [];
    const quizzedIds = new Set<string>();
    for (const att of attempts) {
      if (att.quizSetId === quizSet.id) {
        for (const ans of att.answers) {
          quizzedIds.add(ans.questionId);
        }
      }
    }
    return quizSet.questions.filter((q) => !quizzedIds.has(q.id));
  }, [quizSet, attempts]);

  const hasPriorAttempts = useMemo(
    () => Boolean(quizSet && attempts.some((a) => a.quizSetId === quizSet.id)),
    [quizSet, attempts]
  );

  if (!hydrated) {
    return (
      <div className="py-12 text-center font-bold text-text-muted">
        Loading quiz...
      </div>
    );
  }

  if (!quizSet) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center flex flex-col items-center gap-4">
        <h1 className="text-2xl font-extrabold text-text">Quiz not found</h1>
        <p className="text-text-muted font-semibold">
          This quiz may have been deleted from your device.
        </p>
        <Link href="/library">
          <Button variant="primary">Back to Library</Button>
        </Link>
      </div>
    );
  }

  const activeTypes = selectedTypes ?? availableTypes;
  const sourcePool =
    unquizzedOnly && unquizzedQuestions.length > 0
      ? unquizzedQuestions
      : quizSet.questions;
  const matchingCount =
    targetMode === "original"
      ? sourcePool.filter((q) => activeTypes.includes(q.type)).length
      : sourcePool.length;

  const toggleType = (type: QuestionType) => {
    if (typeCounts[type] === 0) return;
    sound.playClick();
    const base = activeTypes;
    if (base.includes(type)) {
      if (base.length === 1) return; // keep at least one
      setSelectedTypes(base.filter((t) => t !== type));
    } else {
      setSelectedTypes([...base, type]);
    }
  };

  const handleStart = () => {
    const settings: QuizSettings = {
      types: activeTypes,
      targetMode,
      shuffleQuestions,
      shuffleChoices,
      questionCount:
        countMode === "all"
          ? "all"
          : Math.max(1, Math.min(customCount, matchingCount)),
      feedbackMode,
      timerMinutes: useTimer ? Math.max(1, timerMinutes) : undefined,
      typoTolerance,
    };
    sound.playStart();
    startSession({ ...quizSet, questions: sourcePool }, settings);
    router.push(`/quiz/${quizSet.id}/play`);
  };

  return (
    <div className="mx-auto max-w-[600px] flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/library"
          aria-label="Back to library"
          className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl border-2 border-border bg-surface text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text leading-tight">
            {quizSet.title}
          </h1>
          <p className="text-sm font-semibold text-text-muted">
            {quizSet.questions.length} total questions
          </p>
        </div>
      </div>

      {/* Practice Mode / Convert Questions */}
      <Card className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-text">Question Mode</h2>
          <p className="text-xs font-semibold text-text-muted">
            Keep original formats or convert compatible questions into a single
            mode.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {(
            [
              { id: "original", label: "As Imported" },
              { id: "multiple_choice", label: "Multiple Choice" },
              { id: "identification", label: "Identification" },
              { id: "enumeration", label: "Enumeration" },
            ] as const
          ).map((mode) => {
            const active = targetMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setTargetMode(mode.id);
                }}
                className={`focus-ring flex items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-2.5 text-center text-xs font-extrabold uppercase tracking-wide transition-colors ${
                  active
                    ? "border-brand-fill bg-brand-tint text-brand-text"
                    : "border-border bg-surface text-text hover:border-border-strong"
                }`}
              >
                {mode.id === "original" ? (
                  <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <QuestionTypeIcon type={mode.id} className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Question Types (when As Imported is selected) */}
      {targetMode === "original" && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-extrabold text-text">Question Types</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {(["multiple_choice", "identification", "enumeration"] as QuestionType[]).map(
              (type) => {
                const count = typeCounts[type];
                const active = activeTypes.includes(type);
                const disabled = count === 0;
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleType(type)}
                    className={`focus-ring flex flex-col items-start rounded-xl border-2 p-3 text-left transition-colors ${
                      disabled
                        ? "border-border bg-disabled-bg text-text-faint cursor-not-allowed"
                        : active
                        ? "border-brand-fill bg-brand-tint text-brand-text"
                        : "border-border bg-surface text-text hover:border-border-strong"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-extrabold">
                      <QuestionTypeIcon type={type} />
                      <span>{TYPE_LABELS[type]}</span>
                    </span>
                    <span className="text-xs font-bold opacity-80">
                      {count} {count === 1 ? "question" : "questions"}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </Card>
      )}

      {/* Feedback Mode */}
      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold text-text">Feedback Mode</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setFeedbackMode("immediate");
            }}
            className={`focus-ring rounded-xl border-2 p-3.5 text-left transition-colors ${
              feedbackMode === "immediate"
                ? "border-brand-fill bg-brand-tint text-brand-text"
                : "border-border bg-surface text-text hover:border-border-strong"
            }`}
          >
            <div className="font-extrabold text-base">Immediate</div>
            <div className="text-xs font-semibold text-text-muted mt-0.5">
              Check each answer right away
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setFeedbackMode("end");
            }}
            className={`focus-ring rounded-xl border-2 p-3.5 text-left transition-colors ${
              feedbackMode === "end"
                ? "border-brand-fill bg-brand-tint text-brand-text"
                : "border-border bg-surface text-text hover:border-border-strong"
            }`}
          >
            <div className="font-extrabold text-base">At the End</div>
            <div className="text-xs font-semibold text-text-muted mt-0.5">
              Review all answers after finishing
            </div>
          </button>
        </div>
      </Card>

      {/* Question Count & Options */}
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-extrabold text-text">Quiz Options</h2>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="font-bold text-text">Number of Questions</div>
            <div className="text-sm font-semibold text-text-muted">
              Up to {matchingCount} available
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setCountMode("all");
              }}
              className={`focus-ring rounded-xl border-2 px-3 py-1.5 text-sm font-extrabold ${
                countMode === "all"
                  ? "border-brand-fill bg-brand-tint text-brand-text"
                  : "border-border bg-surface text-text-muted"
              }`}
            >
              All ({matchingCount})
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setCountMode("custom");
              }}
              className={`focus-ring rounded-xl border-2 px-3 py-1.5 text-sm font-extrabold ${
                countMode === "custom"
                  ? "border-brand-fill bg-brand-tint text-brand-text"
                  : "border-border bg-surface text-text-muted"
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-bg-subtle p-3">
          <label
            htmlFor="custom-count"
            className={`text-sm font-bold ${
              countMode === "all" ? "text-text-faint" : "text-text-muted"
            }`}
          >
            Custom count:
          </label>
          <input
            id="custom-count"
            type="number"
            min={1}
            max={matchingCount}
            disabled={countMode === "all"}
            value={countMode === "all" ? matchingCount : customCount}
            onChange={(e) => setCustomCount(Number(e.target.value) || 1)}
            className="h-10 w-24 rounded-lg border-2 border-border bg-surface px-3 font-extrabold text-text focus:border-brand-fill focus:outline-none disabled:bg-disabled-bg disabled:text-text-faint disabled:cursor-not-allowed"
          />
        </div>

        <div className="divide-y-2 divide-border">
          {hasPriorAttempts && (
            <Toggle
              checked={unquizzedOnly && unquizzedQuestions.length > 0}
              onChange={setUnquizzedOnly}
              label="Continue unquizzed questions only"
              description={
                unquizzedQuestions.length > 0
                  ? `${unquizzedQuestions.length} of ${quizSet.questions.length} not yet quizzed`
                  : "All questions in this set have been quizzed"
              }
              disabled={unquizzedQuestions.length === 0}
            />
          )}
          <Toggle
            checked={shuffleQuestions}
            onChange={setShuffleQuestions}
            label="Randomize question order"
          />
          <Toggle
            checked={shuffleChoices}
            onChange={setShuffleChoices}
            label="Randomize choices"
            description="Shuffles multiple-choice options"
            disabled={
              targetMode !== "multiple_choice" &&
              (targetMode !== "original" ||
                !activeTypes.includes("multiple_choice"))
            }
          />
          <Toggle
            checked={typoTolerance}
            onChange={setTypoTolerance}
            label="Typo tolerance"
            description="Accept minor spelling slips on 6+ letter answers"
            disabled={
              targetMode !== "identification" &&
              (targetMode !== "original" ||
                !activeTypes.includes("identification"))
            }
          />
          <Toggle
            checked={useTimer}
            onChange={setUseTimer}
            label="Time limit"
            description="Optional countdown timer"
          />
        </div>

        {useTimer && (
          <div className="flex items-center gap-3 rounded-xl bg-bg-subtle p-3">
            <label
              htmlFor="timer-minutes"
              className="text-sm font-bold text-text-muted"
            >
              Minutes:
            </label>
            <input
              id="timer-minutes"
              type="number"
              min={1}
              max={180}
              value={timerMinutes}
              onChange={(e) => setTimerMinutes(Number(e.target.value) || 1)}
              className="h-10 w-24 rounded-lg border-2 border-border bg-surface px-3 font-extrabold text-text focus:border-brand-fill focus:outline-none"
            />
          </div>
        )}
      </Card>

      <Button
        variant="primary"
        fullWidth
        silent
        disabled={matchingCount === 0}
        onClick={handleStart}
      >
        <Play className="h-4 w-4 fill-current" />
        Start Quiz ({countMode === "all" ? matchingCount : Math.min(customCount, matchingCount)}{" "}
        Questions)
      </Button>
    </div>
  );
}
