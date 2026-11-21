"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  Clock,
  Flame,
  RefreshCw,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import { ScoreRing } from "@/components/results/ScoreRing";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { sound } from "@/lib/sound";
import type { QuestionType } from "@/lib/types";
import { useQuizSession } from "@/store/useQuizSession";

function getTierCopy(score: number): { title: string; subtitle: string; emoji: string } {
  if (score === 100) {
    return {
      title: "Perfect score!",
      subtitle: "You nailed every single question. Outstanding mastery!",
      emoji: "🏆",
    };
  }
  if (score >= 90) {
    return {
      title: "Outstanding!",
      subtitle: "Almost flawless—your hard work is paying off.",
      emoji: "🌟",
    };
  }
  if (score >= 75) {
    return {
      title: "Great job!",
      subtitle: "Solid command of the material. Keep the momentum going!",
      emoji: "🎉",
    };
  }
  if (score >= 50) {
    return {
      title: "Solid progress!",
      subtitle: "You're building real confidence. Review the tricky ones next!",
      emoji: "💪",
    };
  }
  return {
    title: "Every attempt makes you stronger.",
    subtitle: "Use the review screen to revisit the topics that tripped you up.",
    emoji: "🌱",
  };
}

function formatDuration(ms: number): string {
  const totalSec = Math.max(1, Math.round(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const lastCompleted = useQuizSession((s) => s.lastCompleted);
  const startRetryWrong = useQuizSession((s) => s.startRetryWrong);

  useEffect(() => {
    if (!lastCompleted) return;
    const score = lastCompleted.attempt.accuracy;
    sound.playCelebration(score);
    if (lastCompleted.newlyUnlocked.length > 0) {
      sound.playBadge();
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (score === 100) {
      const end = Date.now() + 1800;
      const frame = () => {
        confetti({ particleCount: 5, angle: 60, spread: 70, origin: { x: 0 } });
        confetti({ particleCount: 5, angle: 120, spread: 70, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    } else if (score >= 75) {
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    }
  }, [lastCompleted]);

  const typeBreakdown = useMemo(() => {
    if (!lastCompleted) return [];
    const map = new Map<QuestionType, { earned: number; total: number }>();
    const qMap = new Map(lastCompleted.questions.map((q) => [q.id, q]));

    for (const ans of lastCompleted.attempt.answers) {
      const q = qMap.get(ans.questionId);
      if (!q) continue;
      const entry = map.get(q.type) ?? { earned: 0, total: 0 };
      entry.earned += ans.score;
      entry.total += 1;
      map.set(q.type, entry);
    }

    return Array.from(map.entries()).map(([type, val]) => ({
      type,
      pct: Math.round((val.earned / val.total) * 100),
      total: val.total,
    }));
  }, [lastCompleted]);

  if (!lastCompleted) {
    return (
      <div className="mx-auto max-w-md py-16 text-center flex flex-col items-center gap-4">
        <h1 className="text-2xl font-extrabold text-text">No recent results</h1>
        <p className="text-text-muted font-semibold">
          Complete a quiz to see your score and breakdown.
        </p>
        <Link href={`/quiz/${id}/setup`}>
          <Button variant="primary">Start Quiz</Button>
        </Link>
      </div>
    );
  }

  const { attempt, questions, newlyUnlocked, previousBest, previousLatest } =
    lastCompleted;
  const tier = getTierCopy(attempt.accuracy);
  const wrongQuestions = questions.filter((q) => {
    const ans = attempt.answers.find((a) => a.questionId === q.id);
    return !ans?.isCorrect;
  });

  const isNewBest = previousBest !== null && attempt.accuracy > previousBest;
  const delta =
    previousLatest !== null ? attempt.accuracy - previousLatest : null;

  const handleRetryWrong = () => {
    if (wrongQuestions.length === 0) return;
    startRetryWrong(
      attempt.quizSetId,
      attempt.quizTitle,
      wrongQuestions,
      attempt.settings
    );
    router.push(`/quiz/${id}/play`);
  };

  return (
    <div className="mx-auto max-w-[600px] flex flex-col gap-6">
      {/* Celebration Hero */}
      <Card className="flex flex-col items-center gap-4 py-8 text-center">
        <motion.img
          src={
            attempt.accuracy >= 50
              ? "/mascot/thumbs-up.png"
              : "/mascot/sad.png"
          }
          alt={
            attempt.accuracy >= 50
              ? "Quizzit mascot giving a thumbs up"
              : "Quizzit mascot encouraging you to try again"
          }
          initial={{ scale: 0.4, rotate: -10, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 16 }}
          className="h-32 w-32 object-contain"
        />
        <ScoreRing target={attempt.accuracy} />
        <div className="max-w-md px-2">
          <h1 className="text-3xl font-extrabold text-text">{tier.title}</h1>
          <p className="mt-1 text-base font-semibold text-text-muted">
            {tier.subtitle}
          </p>
        </div>

        {(isNewBest || (delta !== null && delta > 0)) && (
          <div className="inline-flex items-center gap-2 rounded-full bg-success-bg px-4 py-1.5 text-sm font-extrabold text-success">
            <TrendingUp className="h-4 w-4" />
            <span>
              {isNewBest
                ? "New best score!"
                : `You improved by ${delta}% since your last attempt!`}
            </span>
          </div>
        )}
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className="flex flex-col items-center text-center gap-1 p-3 sm:py-4">
          <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
          <div className="text-base sm:text-xl font-extrabold text-text">
            {Number(attempt.totalScore.toFixed(1))} / {questions.length}
          </div>
          <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-text-muted">
            Score
          </div>
        </Card>

        <Card className="flex flex-col items-center text-center gap-1 p-3 sm:py-4">
          <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-brand-text" />
          <div className="text-base sm:text-xl font-extrabold text-text">
            {formatDuration(attempt.finishedAt - attempt.startedAt)}
          </div>
          <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-text-muted">
            Time
          </div>
        </Card>

        <Card className="flex flex-col items-center text-center gap-1 p-3 sm:py-4">
          <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-warning fill-warning" />
          <div className="text-base sm:text-xl font-extrabold text-text">
            {attempt.longestStreak}
          </div>
          <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-text-muted">
            Best Streak
          </div>
        </Card>
      </div>

      {/* Accuracy per type */}
      {typeBreakdown.length > 0 && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-extrabold text-text">
            Accuracy by Question Type
          </h2>
          <div className="flex flex-col gap-2">
            {typeBreakdown.map((item) => (
              <div
                key={item.type}
                className="flex items-center justify-between rounded-xl bg-bg-subtle px-4 py-2.5"
              >
                <span className="text-sm font-extrabold capitalize text-text">
                  {item.type.replace("_", " ")} ({item.total})
                </span>
                <span className="text-sm font-extrabold text-brand-text">
                  {item.pct}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Newly Unlocked Badges */}
      {newlyUnlocked.length > 0 && (
        <Card className="border-xp bg-bg-subtle flex flex-col gap-3">
          <div className="flex items-center gap-2 text-text">
            <Award className="h-5 w-5 text-xp" />
            <h2 className="text-lg font-extrabold">
              Badge{newlyUnlocked.length > 1 ? "s" : ""} Unlocked!
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {newlyUnlocked.map((badge, idx) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 12, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 460,
                  damping: 22,
                  delay: 0.15 + idx * 0.08,
                }}
                className="flex items-center gap-3 rounded-xl border-2 border-border bg-surface p-3"
              >
                <span className="text-2xl">{badge.icon}</span>
                <div>
                  <div className="font-extrabold text-text">{badge.name}</div>
                  <div className="text-xs font-semibold text-text-muted">
                    {badge.description}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Next Actions */}
      <div className="flex flex-col gap-3">
        <Link href={`/quiz/${id}/review`}>
          <Button variant="primary" fullWidth>
            Review Answers
          </Button>
        </Link>

        {wrongQuestions.length > 0 && (
          <Button variant="secondary" fullWidth onClick={handleRetryWrong}>
            <RotateCcw className="h-4 w-4" />
            Retry Wrong Answers Only ({wrongQuestions.length})
          </Button>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href={`/quiz/${id}/setup`}>
            <Button variant="secondary" fullWidth>
              <RefreshCw className="h-4 w-4" />
              Retake Full Quiz
            </Button>
          </Link>
          <Link href="/library">
            <Button variant="ghost" fullWidth>
              Back to Library
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
