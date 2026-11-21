"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Flame,
  Lightbulb,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Enumeration } from "@/components/quiz/Enumeration";
import { FeedbackPanel } from "@/components/quiz/FeedbackPanel";
import { Identification } from "@/components/quiz/Identification";
import { MultipleChoice } from "@/components/quiz/MultipleChoice";
import { ProgressBar } from "@/components/quiz/ProgressBar";
import { Timer } from "@/components/quiz/Timer";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { QuestionTypeIcon } from "@/components/QuestionTypeIcon";
import { sound } from "@/lib/sound";
import type { Question, UserAnswer } from "@/lib/types";
import { useLibrary } from "@/store/useLibrary";
import { useQuizSession } from "@/store/useQuizSession";

function initialDraftFor(
  q: Question | undefined,
  existing: UserAnswer | undefined
): { mc: number[]; idText: string; enumVals: string[] } {
  if (!q) return { mc: [], idText: "", enumVals: [] };
  if (q.type === "multiple_choice") {
    return {
      mc: Array.isArray(existing?.response)
        ? (existing.response as number[])
        : [],
      idText: "",
      enumVals: [],
    };
  }
  if (q.type === "identification") {
    return {
      mc: [],
      idText: typeof existing?.response === "string" ? existing.response : "",
      enumVals: [],
    };
  }
  const len = q.count ?? q.answers.length;
  const saved = Array.isArray(existing?.response)
    ? (existing.response as string[])
    : [];
  return {
    mc: [],
    idText: "",
    enumVals: Array.from({ length: len }, (_, i) => saved[i] ?? ""),
  };
}

export default function QuizPlayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const status = useQuizSession((s) => s.status);
  const questions = useQuizSession((s) => s.questions);
  const settings = useQuizSession((s) => s.settings);
  const currentIndex = useQuizSession((s) => s.currentIndex);
  const answers = useQuizSession((s) => s.answers);
  const startedAt = useQuizSession((s) => s.startedAt);
  const currentStreak = useQuizSession((s) => s.currentStreak);
  const pendingResume = useQuizSession((s) => s.pendingResume);
  const checkSavedSession = useQuizSession((s) => s.checkSavedSession);
  const resumeSavedSession = useQuizSession((s) => s.resumeSavedSession);
  const submitAnswer = useQuizSession((s) => s.submitAnswer);
  const next = useQuizSession((s) => s.next);
  const prev = useQuizSession((s) => s.prev);
  const finishSession = useQuizSession((s) => s.finishSession);
  const soundEnabled = useLibrary((s) => s.soundEnabled);
  const setSoundEnabled = useLibrary((s) => s.setSoundEnabled);

  const currentQuestion = questions[currentIndex];
  const existingAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const [mcSelected, setMcSelected] = useState<number[]>([]);
  const [idText, setIdText] = useState("");
  const [enumValues, setEnumValues] = useState<string[]>([]);
  const [checkedAnswer, setCheckedAnswer] = useState<UserAnswer | null>(null);
  const [confirmUnanswered, setConfirmUnanswered] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [eliminatedChoices, setEliminatedChoices] = useState<number[]>([]);
  const [hintStep, setHintStep] = useState(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const shownMilestones = useRef<Set<number>>(new Set());

  // Attempt auto-resume on page refresh if session is stored
  useEffect(() => {
    if (status === "idle") {
      checkSavedSession();
    }
  }, [status, checkSavedSession]);

  useEffect(() => {
    if (status === "idle" && pendingResume?.quizSetId === id) {
      resumeSavedSession();
    }
  }, [status, pendingResume, id, resumeSavedSession]);

  // Sync draft inputs whenever current question changes
  useEffect(() => {
    const draft = initialDraftFor(currentQuestion, existingAnswer);
    setMcSelected(draft.mc);
    setIdText(draft.idText);
    setEnumValues(draft.enumVals);
    setCheckedAnswer(
      settings?.feedbackMode === "immediate" && existingAnswer
        ? existingAnswer
        : null
    );
    setEliminatedChoices([]);
    setHintStep(0);
    setHintText(null);
  }, [currentIndex, currentQuestion?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasDraft = (() => {
    if (!currentQuestion) return false;
    if (currentQuestion.type === "multiple_choice") return mcSelected.length > 0;
    if (currentQuestion.type === "identification") return idText.trim().length > 0;
    return enumValues.some((v) => v.trim().length > 0);
  })();

  const getCurrentResponse = useCallback((): UserAnswer["response"] => {
    if (!currentQuestion) return "";
    if (currentQuestion.type === "multiple_choice") return mcSelected;
    if (currentQuestion.type === "identification") return idText;
    return enumValues;
  }, [currentQuestion, mcSelected, idText, enumValues]);

  const maybeShowMilestone = useCallback(
    (answeredCount: number) => {
      if (questions.length < 4) return;
      const pct = Math.round((answeredCount / questions.length) * 100);
      for (const m of [25, 50, 75]) {
        if (pct >= m && !shownMilestones.current.has(m)) {
          shownMilestones.current.add(m);
          const label =
            m === 50 ? "Halfway there!" : m === 75 ? "Almost done!" : "Great start!";
          sound.playMilestone();
          setToastMsg(`${m}% complete — ${label}`);
          setTimeout(() => setToastMsg(null), 2200);
          break;
        }
      }
    },
    [questions.length]
  );

  const handleComplete = useCallback(() => {
    finishSession();
    router.replace(`/quiz/${id}/results`);
  }, [finishSession, id, router]);

  const handleCheckImmediate = useCallback(() => {
    if (!currentQuestion || !hasDraft || checkedAnswer) return;
    const res = submitAnswer(currentQuestion.id, getCurrentResponse());
    if (res.isCorrect) {
      sound.playCorrect();
    } else {
      sound.playWrong();
    }
    setCheckedAnswer(res);
    maybeShowMilestone(Object.keys(answers).length + 1);
  }, [
    currentQuestion,
    hasDraft,
    checkedAnswer,
    submitAnswer,
    getCurrentResponse,
    maybeShowMilestone,
    answers,
  ]);

  const handleContinueImmediate = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      handleComplete();
    } else {
      next();
    }
  }, [currentIndex, questions.length, handleComplete, next]);

  const saveEndDraft = useCallback(() => {
    if (!currentQuestion) return;
    if (hasDraft) {
      submitAnswer(currentQuestion.id, getCurrentResponse());
    }
  }, [currentQuestion, hasDraft, submitAnswer, getCurrentResponse]);

  const handleEndNext = useCallback(() => {
    saveEndDraft();
    if (currentIndex + 1 >= questions.length) {
      const answeredCount = Object.keys({
        ...answers,
        ...(hasDraft && currentQuestion ? { [currentQuestion.id]: true } : {}),
      }).length;
      if (answeredCount < questions.length) {
        setConfirmUnanswered(true);
      } else {
        handleComplete();
      }
    } else {
      sound.playNav();
      next();
    }
  }, [
    saveEndDraft,
    currentIndex,
    questions.length,
    answers,
    hasDraft,
    currentQuestion,
    handleComplete,
    next,
  ]);

  const handleEndPrev = useCallback(() => {
    saveEndDraft();
    sound.playNav();
    prev();
  }, [saveEndDraft, prev]);

  const handleHint = useCallback(() => {
    if (!currentQuestion || checkedAnswer) return;
    sound.playHint();

    if (currentQuestion.hint && hintStep === 0) {
      setHintText(currentQuestion.hint);
      setHintStep(1);
      return;
    }

    if (currentQuestion.type === "multiple_choice") {
      const wrongIndices = currentQuestion.choices
        .map((_, idx) => idx)
        .filter(
          (idx) =>
            !currentQuestion.answer.includes(idx) &&
            !eliminatedChoices.includes(idx)
        );
      if (wrongIndices.length > 0) {
        const pick =
          wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
        setEliminatedChoices((prevElim) => [...prevElim, pick]);
        setMcSelected((prevSel) => prevSel.filter((i) => i !== pick));
        setHintText("Eliminated one incorrect choice.");
      } else {
        setHintText("No more wrong choices left to eliminate!");
      }
      setHintStep((s) => s + 1);
      return;
    }

    if (currentQuestion.type === "identification") {
      const main = currentQuestion.answers[0] ?? "";
      const revealCount = Math.min(
        main.length,
        (currentQuestion.hint ? hintStep : hintStep + 1)
      );
      const masked = main
        .split("")
        .map((ch, idx) => {
          if (ch === " ") return "  ";
          return idx < revealCount ? ch : "_";
        })
        .join(" ");
      setHintText(`${masked} (${main.length} chars)`);
      setHintStep((s) => s + 1);
      return;
    }

    if (currentQuestion.type === "enumeration") {
      const idx = currentQuestion.hint ? hintStep - 1 : hintStep;
      if (idx < currentQuestion.answers.length) {
        const revealed = currentQuestion.answers.slice(0, idx + 1).join(" • ");
        setHintText(`Item${idx > 0 ? "s" : ""}: ${revealed}`);
        setHintStep((s) => s + 1);
      } else {
        setHintText("All items revealed!");
      }
    }
  }, [currentQuestion, checkedAnswer, hintStep, eliminatedChoices]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (confirmUnanswered || confirmExit) return;
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if (
        !isInput &&
        currentQuestion?.type === "multiple_choice" &&
        !checkedAnswer &&
        /^[1-9]$/.test(e.key)
      ) {
        const idx = Number(e.key) - 1;
        if (idx < currentQuestion.choices.length) {
          e.preventDefault();
          if (currentQuestion.multiSelect) {
            setMcSelected((prevSel) =>
              prevSel.includes(idx)
                ? prevSel.filter((i) => i !== idx)
                : [...prevSel, idx]
            );
          } else {
            setMcSelected([idx]);
          }
        }
        return;
      }

      if (e.key === "Enter" && !isInput) {
        if (settings?.feedbackMode === "immediate") {
          if (checkedAnswer) {
            e.preventDefault();
            handleContinueImmediate();
          } else if (hasDraft) {
            e.preventDefault();
            handleCheckImmediate();
          }
        } else if (settings?.feedbackMode === "end") {
          e.preventDefault();
          handleEndNext();
        }
        return;
      }

      if (!isInput && settings?.feedbackMode === "end") {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          handleEndNext();
        } else if (e.key === "ArrowLeft" && currentIndex > 0) {
          e.preventDefault();
          handleEndPrev();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    confirmUnanswered,
    confirmExit,
    currentQuestion,
    checkedAnswer,
    settings?.feedbackMode,
    hasDraft,
    currentIndex,
    handleCheckImmediate,
    handleContinueImmediate,
    handleEndNext,
    handleEndPrev,
  ]);

  if (status === "finished") {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg px-4">
        <p className="text-lg font-extrabold text-text-muted">
          Calculating your results...
        </p>
      </div>
    );
  }

  if (status !== "in_progress" || !currentQuestion || !settings) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center flex flex-col items-center gap-4">
        <h1 className="text-2xl font-extrabold text-text">
          No active quiz session
        </h1>
        <p className="text-text-muted font-semibold">
          Configure your quiz settings to begin.
        </p>
        <Link href={`/quiz/${id}/setup`}>
          <Button variant="primary">Go to Setup</Button>
        </Link>
      </div>
    );
  }

  const isImmediate = settings.feedbackMode === "immediate";
  const completedCount = isImmediate
    ? Object.keys(answers).length
    : currentIndex + (hasDraft ? 1 : 0);

  return (
    <div className="min-h-dvh flex flex-col bg-bg overflow-x-hidden">
      <Toast message={toastMsg} />

      {/* Top Lesson Header */}
      <header className="mx-auto flex w-full max-w-[600px] items-center gap-2 sm:gap-3 px-4 pt-4 sm:pt-5 pb-3">
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setConfirmExit(true);
          }}
          aria-label="Exit quiz"
          className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-text-muted hover:bg-bg-subtle hover:text-text"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="min-w-0 flex-1">
          <ProgressBar
            current={completedCount}
            total={questions.length}
            completed={completedCount === questions.length}
          />
        </div>

        {settings.timerMinutes && (
          <Timer
            minutes={settings.timerMinutes}
            startedAt={startedAt}
            onExpire={handleComplete}
          />
        )}

        {isImmediate && currentStreak > 0 && (
          <motion.div
            key={currentStreak}
            initial={{ scale: 0.7, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 550, damping: 16 }}
            className="flex shrink-0 items-center gap-1 rounded-full border-2 border-border bg-surface px-3 py-1.5 text-sm font-extrabold text-warning"
            title="Current streak"
          >
            <Flame className="h-4 w-4 fill-warning" />
            <span>{currentStreak}</span>
          </motion.div>
        )}

        <button
          type="button"
          onClick={() => {
            const nextVal = !soundEnabled;
            setSoundEnabled(nextVal);
            if (nextVal) sound.playClick();
          }}
          aria-label={soundEnabled ? "Mute sound effects" : "Enable sound effects"}
          title={soundEnabled ? "Sound on" : "Sound muted"}
          className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-text-muted hover:bg-bg-subtle hover:text-text"
        >
          {soundEnabled ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
        </button>
      </header>

      {/* Question Area */}
      <div className="mx-auto flex w-full max-w-[600px] flex-1 flex-col justify-between px-4 py-4 sm:py-6 pb-48 sm:pb-36">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ type: "spring", stiffness: 520, damping: 32 }}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center justify-between gap-2 text-xs font-extrabold uppercase tracking-wider text-text-muted">
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5">
                  <QuestionTypeIcon type={currentQuestion.type} className="h-3.5 w-3.5" />
                  <span>{currentQuestion.type.replace("_", " ")}</span>
                </span>
                {!checkedAnswer && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={handleHint}
                    className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-info/50 bg-info/10 px-4 py-1.5 text-sm font-extrabold text-info hover:bg-info/20 transition-colors"
                  >
                    <Lightbulb className="h-4 w-4" />
                    Hint
                  </motion.button>
                )}
              </div>
            </div>

            <h1 className="text-2xl sm:text-[26px] font-extrabold text-text leading-snug">
              {currentQuestion.prompt}
            </h1>

            {hintText && (
              <div
                role="note"
                className="flex items-start gap-2.5 rounded-2xl border-2 border-info/50 bg-info/10 px-4 py-3 text-sm font-bold text-text"
              >
                <Lightbulb className="h-4 w-4 shrink-0 text-info mt-0.5" />
                <span className="font-mono">{hintText}</span>
              </div>
            )}

            {currentQuestion.type === "multiple_choice" && (
              <MultipleChoice
                question={currentQuestion}
                selected={mcSelected}
                onChange={(nextSel) => {
                  sound.playClick();
                  setMcSelected(nextSel);
                }}
                locked={Boolean(checkedAnswer)}
                showFeedback={Boolean(checkedAnswer)}
                eliminatedIndices={eliminatedChoices}
              />
            )}

            {currentQuestion.type === "identification" && (
              <Identification
                question={currentQuestion}
                value={idText}
                onChange={setIdText}
                locked={Boolean(checkedAnswer)}
                onEnter={
                  isImmediate
                    ? checkedAnswer
                      ? handleContinueImmediate
                      : handleCheckImmediate
                    : handleEndNext
                }
              />
            )}

            {currentQuestion.type === "enumeration" && (
              <Enumeration
                question={currentQuestion}
                values={enumValues}
                onChange={setEnumValues}
                locked={Boolean(checkedAnswer)}
              />
            )}
          </motion.div>
        </AnimatePresence>

          {/* Action Footer (when feedback panel is not shown) */}
          {!checkedAnswer && (
            <div className="mt-8 flex items-center justify-between gap-3">
              {isImmediate ? (
                <Button
                  variant="primary"
                  fullWidth
                  silent
                  disabled={!hasDraft}
                  onClick={handleCheckImmediate}
                >
                  Check
                </Button>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    silent
                    disabled={currentIndex === 0}
                    onClick={handleEndPrev}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <Button
                    variant="primary"
                    silent
                    onClick={handleEndNext}
                    className="flex-1 sm:flex-initial"
                  >
                    {currentIndex + 1 >= questions.length ? (
                      "Finish"
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Immediate Feedback Banner */}
        {isImmediate && checkedAnswer && (
          <FeedbackPanel
            question={currentQuestion}
            answer={checkedAnswer}
            isLast={currentIndex + 1 >= questions.length}
            onContinue={handleContinueImmediate}
          />
        )}

        {/* Unanswered Confirmation Modal (end mode) */}
        <Modal
          open={confirmUnanswered}
          onClose={() => setConfirmUnanswered(false)}
          title="Finish with unanswered questions?"
        >
          <div className="flex flex-col gap-4">
            <p className="text-base font-semibold text-text-muted">
              You still have unanswered questions. Submit anyway?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setConfirmUnanswered(false)}
              >
                Keep Reviewing
              </Button>
              <Button variant="primary" onClick={handleComplete}>
                Submit Quiz
              </Button>
            </div>
          </div>
        </Modal>

        {/* Exit Confirmation Modal */}
        <Modal
          open={confirmExit}
          onClose={() => setConfirmExit(false)}
          title="Leave quiz?"
        >
          <div className="flex flex-col gap-4">
            <p className="text-base font-semibold text-text-muted">
              Your progress is saved automatically. You can resume later from the
              Home screen.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmExit(false)}>
                Stay
              </Button>
              <Button variant="danger" onClick={() => router.push("/library")}>
                Leave Quiz
              </Button>
            </div>
          </div>
        </Modal>
      </div>
      );
}
