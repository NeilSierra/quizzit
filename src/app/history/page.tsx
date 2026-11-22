"use client";

import Link from "next/link";
import { Award, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ALL_BADGES } from "@/lib/badges";
import { useLibrary } from "@/store/useLibrary";

export default function HistoryPage() {
  const attempts = useLibrary((s) => s.attempts);
  const stats = useLibrary((s) => s.stats);
  const hydrated = useLibrary((s) => s.hydrated);

  if (!hydrated) {
    return (
      <div className="py-12 text-center font-bold text-text-muted">
        Loading history...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold text-text">History</h1>
        <p className="text-base font-semibold text-text-muted">
          Track your unlocked badges and past quiz attempts.
        </p>
      </div>

      {/* Badges */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-xp" />
            <h2 className="text-2xl font-extrabold text-text">Badges</h2>
          </div>
          <span className="rounded-full bg-accent-tint px-3 py-1 text-xs font-extrabold text-accent-text">
            {stats.unlockedBadges.length} / {ALL_BADGES.length} unlocked
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_BADGES.map((badge) => {
            const unlocked = stats.unlockedBadges.includes(badge.id);
            return (
              <Card
                key={badge.id}
                className={`flex items-center gap-3 ${
                  unlocked ? "border-xp bg-surface" : "opacity-55"
                }`}
              >
                <span className="text-3xl" aria-hidden="true">
                  {badge.icon}
                </span>
                <div>
                  <div className="font-extrabold text-text">{badge.name}</div>
                  <div className="text-xs font-semibold text-text-muted">
                    {badge.description}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Recent Attempts */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-2xl font-extrabold text-text">Past Attempts</h2>
          {attempts.length > 0 && (
            <span className="rounded-full bg-brand-tint px-3 py-1 text-xs font-extrabold text-brand-text">
              {attempts.length} total
            </span>
          )}
        </div>
        {attempts.length === 0 ? (
          <Card elevation="subtle" className="py-10 text-center flex flex-col items-center gap-4">
            <p className="text-text-muted font-semibold">
              No completed quizzes yet. Finish a quiz to see your history here!
            </p>
            <Link href="/library">
              <Button variant="accent">
                <BookOpen className="h-4 w-4" />
                Go to Library
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {attempts.slice(0, 20).map((att) => (
              <Card
                key={att.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <h3 className="font-extrabold text-text">{att.quizTitle}</h3>
                  <p className="text-xs font-semibold text-text-muted">
                    {new Date(att.finishedAt).toLocaleString()} &bull;{" "}
                    {att.answers.length} questions &bull;{" "}
                    {att.settings.feedbackMode} mode
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-extrabold ${
                      att.accuracy >= 75
                        ? "bg-success-bg text-success"
                        : "bg-brand-tint text-brand-text"
                    }`}
                  >
                    {att.accuracy}%
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
