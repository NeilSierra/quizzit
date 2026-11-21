"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Play,
  Sparkles,
  Upload,
} from "lucide-react";
import { FeedbackSection } from "@/components/FeedbackSection";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLibrary } from "@/store/useLibrary";
import { useQuizSession } from "@/store/useQuizSession";

export default function HomePage() {
  const router = useRouter();
  const quizSets = useLibrary((s) => s.quizSets);
  const attempts = useLibrary((s) => s.attempts);
  const stats = useLibrary((s) => s.stats);
  const importSampleQuiz = useLibrary((s) => s.importSampleQuiz);

  const pendingResume = useQuizSession((s) => s.pendingResume);
  const resumeSavedSession = useQuizSession((s) => s.resumeSavedSession);
  const discardSavedSession = useQuizSession((s) => s.discardSavedSession);

  const recentQuizzes = quizSets.slice(0, 4);

  const handleResume = () => {
    if (!pendingResume) return;
    const id = pendingResume.quizSetId;
    resumeSavedSession();
    router.push(`/quiz/${id}/play`);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Resume in-progress banner */}
      {pendingResume && (
        <Card className="border-brand-fill bg-brand-tint flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-brand-text">
              Quiz in progress
            </p>
            <h2 className="text-xl font-extrabold text-text">
              Resume &ldquo;{pendingResume.quizTitle}&rdquo;?
            </h2>
            <p className="text-sm font-semibold text-text-muted">
              Question {pendingResume.currentIndex + 1} of{" "}
              {pendingResume.questions.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={discardSavedSession}>
              Discard
            </Button>
            <Button variant="primary" onClick={handleResume}>
              <Play className="h-4 w-4 fill-current" />
              Resume
            </Button>
          </div>
        </Card>
      )}

      {/* Centered Brand Intro */}
      <div className="flex flex-col items-center text-center gap-1.5 py-2">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-brand-text">
          Quizzit
        </h1>
        <p className="max-w-lg text-base sm:text-lg font-semibold text-text-muted">
          Import your own questions, customize your practice, and master every
          topic.
        </p>
      </div>

      {/* Hero */}
      <Card className="p-6 sm:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight leading-tight">
            Bring your own questions. Master every topic.
          </h2>
          <p className="text-base sm:text-lg font-semibold text-text-muted">
            Import JSON or CSV study sets, customize your practice mode, and
            track your progress and personal bests—right in your browser.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <Link href="/import" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full sm:w-auto">
              <Upload className="h-4 w-4" />
              Import a Quiz
            </Button>
          </Link>
          {quizSets.length === 0 ? (
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => {
                const sample = importSampleQuiz();
                router.push(`/quiz/${sample.id}/setup`);
              }}
            >
              <Sparkles className="h-4 w-4" />
              Try Sample Quiz
            </Button>
          ) : (
            <Link href="/library" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto">
                <BookOpen className="h-4 w-4" />
                Open Library
              </Button>
            </Link>
          )}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-center text-center sm:text-left md:text-center lg:text-left gap-2 sm:gap-3 p-3 sm:p-5">
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand-text">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-extrabold text-text">
              {quizSets.length}
            </p>
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-text-muted">
              Quiz Sets
            </p>
          </div>
        </Card>

        <Card className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-center text-center sm:text-left md:text-center lg:text-left gap-2 sm:gap-3 p-3 sm:p-5">
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-success">
            <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-extrabold text-text">
              {attempts.length}
            </p>
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-text-muted">
              Completed
            </p>
          </div>
        </Card>

        <Card className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-center text-center sm:text-left md:text-center lg:text-left gap-2 sm:gap-3 p-3 sm:p-5">
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-xp">
            <Award className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-extrabold text-text">
              {stats.unlockedBadges.length}
            </p>
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-text-muted">
              Badges
            </p>
          </div>
        </Card>
      </div>

      {/* Recent Quizzes */}
      {recentQuizzes.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-text">Recent Quizzes</h2>
            <Link
              href="/library"
              className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-extrabold uppercase tracking-wide text-brand-text hover:underline"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {recentQuizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="flex min-w-0 overflow-hidden items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-lg font-extrabold text-text">
                    {quiz.title}
                  </h3>
                  <p className="text-sm font-semibold text-text-muted">
                    {quiz.questions.length} questions
                  </p>
                </div>
                <Link href={`/quiz/${quiz.id}/setup`} className="shrink-0">
                  <Button variant="primary">
                    <Play className="h-4 w-4 fill-current" />
                    Start
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </section>
      )}

      <FeedbackSection />
    </div>
  );
}
