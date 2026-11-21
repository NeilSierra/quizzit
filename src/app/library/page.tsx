"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Download,
  Pencil,
  Play,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { sound } from "@/lib/sound";
import type { QuizSet } from "@/lib/types";
import { useLibrary } from "@/store/useLibrary";

export default function LibraryPage() {
  const quizSets = useLibrary((s) => s.quizSets);
  const attempts = useLibrary((s) => s.attempts);
  const hydrated = useLibrary((s) => s.hydrated);
  const renameQuizSet = useLibrary((s) => s.renameQuizSet);
  const deleteQuizSet = useLibrary((s) => s.deleteQuizSet);
  const importSampleQuiz = useLibrary((s) => s.importSampleQuiz);

  const [search, setSearch] = useState("");
  const [renaming, setRenaming] = useState<QuizSet | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<QuizSet | null>(null);

  const filteredQuizSets = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return quizSets;
    return quizSets.filter(
      (quiz) =>
        quiz.title.toLowerCase().includes(q) ||
        (quiz.description && quiz.description.toLowerCase().includes(q))
    );
  }, [quizSets, search]);

  const getBestScore = (quizId: string) => {
    const matching = attempts.filter((a) => a.quizSetId === quizId);
    if (matching.length === 0) return null;
    return Math.max(...matching.map((a) => a.accuracy));
  };

  const handleExport = (quiz: QuizSet) => {
    const json = JSON.stringify(
      {
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
      },
      null,
      2
    );
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${quiz.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!hydrated) {
    return (
      <div className="py-12 text-center text-text-muted font-bold">
        Loading your library...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text">Your Library</h1>
          <p className="text-base font-semibold text-text-muted">
            {quizSets.length}{" "}
            {quizSets.length === 1 ? "quiz set" : "quiz sets"} saved on this
            device
          </p>
        </div>
        <Link href="/import">
          <Button variant="primary">
            <Upload className="h-4 w-4" />
            Import Quiz
          </Button>
        </Link>
      </div>

      {quizSets.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-tint text-brand-text">
            <BookOpen className="h-8 w-8" />
          </div>
          <div className="max-w-md">
            <h2 className="text-xl font-extrabold text-text">
              Your library is empty
            </h2>
            <p className="mt-1 text-sm font-semibold text-text-muted">
              Import a JSON or CSV question file to get started, or load our
              sample Biology quiz to try it out right now.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/import">
              <Button variant="primary">
                <Upload className="h-4 w-4" />
                Import a File
              </Button>
            </Link>
            <Button variant="secondary" onClick={() => importSampleQuiz()}>
              <Sparkles className="h-4 w-4" />
              Load Sample Quiz
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quizzes by title or description..."
              aria-label="Search quizzes"
              className="h-12 w-full rounded-2xl border-2 border-border bg-surface pl-11 pr-11 text-base font-semibold text-text placeholder:text-text-faint transition-colors focus:border-brand-fill focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setSearch("");
                }}
                aria-label="Clear search"
                className="focus-ring absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-text-muted hover:bg-bg-subtle hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {filteredQuizSets.length === 0 ? (
            <Card className="py-10 text-center flex flex-col items-center gap-3">
              <p className="text-lg font-extrabold text-text">
                No quizzes match &ldquo;{search}&rdquo;
              </p>
              <Button variant="secondary" onClick={() => setSearch("")}>
                Clear Search
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredQuizSets.map((quiz) => {
            const best = getBestScore(quiz.id);
            const mc = quiz.questions.filter(
              (q) => q.type === "multiple_choice"
            ).length;
            const id = quiz.questions.filter(
              (q) => q.type === "identification"
            ).length;
            const en = quiz.questions.filter(
              (q) => q.type === "enumeration"
            ).length;

            return (
              <Card key={quiz.id} className="flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-xl font-extrabold text-text leading-snug">
                      {quiz.title}
                    </h2>
                    {best !== null && (
                      <span className="shrink-0 rounded-full bg-success-bg px-2.5 py-0.5 text-xs font-extrabold text-success">
                        Best: {best}%
                      </span>
                    )}
                  </div>
                  {quiz.description && (
                    <p className="text-sm font-semibold text-text-muted">
                      {quiz.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="rounded-lg bg-brand-tint px-2.5 py-0.5 text-xs font-extrabold text-brand-text">
                      {quiz.questions.length} Qs
                    </span>
                    {mc > 0 && (
                      <span className="rounded-lg bg-bg-subtle px-2.5 py-0.5 text-xs font-bold text-text-muted">
                        MC: {mc}
                      </span>
                    )}
                    {id > 0 && (
                      <span className="rounded-lg bg-bg-subtle px-2.5 py-0.5 text-xs font-bold text-text-muted">
                        ID: {id}
                      </span>
                    )}
                    {en > 0 && (
                      <span className="rounded-lg bg-bg-subtle px-2.5 py-0.5 text-xs font-bold text-text-muted">
                        ENUM: {en}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t-2 border-border">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setRenaming(quiz);
                        setRenameValue(quiz.title);
                      }}
                      aria-label={`Rename ${quiz.title}`}
                      className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl text-text-muted hover:bg-bg-subtle hover:text-text"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport(quiz)}
                      aria-label={`Export ${quiz.title}`}
                      className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl text-text-muted hover:bg-bg-subtle hover:text-text"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(quiz)}
                      aria-label={`Delete ${quiz.title}`}
                      className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl text-text-muted hover:bg-danger-bg hover:text-danger"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <Link href={`/quiz/${quiz.id}/setup`}>
                    <Button variant="primary">
                      <Play className="h-4 w-4 fill-current" />
                      Start
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
            </div>
          )}
        </>
      )}

      {/* Rename Modal */}
      <Modal
        open={Boolean(renaming)}
        onClose={() => setRenaming(null)}
        title="Rename Quiz"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (renaming && renameValue.trim()) {
              renameQuizSet(renaming.id, renameValue);
              setRenaming(null);
            }
          }}
          className="flex flex-col gap-4"
        >
          <Input
            label="Quiz Title"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!renameValue.trim()}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete Quiz?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-base font-semibold text-text-muted">
            Are you sure you want to delete{" "}
            <strong className="text-text">{deleting?.title}</strong>? This
            cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleting) deleteQuizSet(deleting.id);
                setDeleting(null);
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
