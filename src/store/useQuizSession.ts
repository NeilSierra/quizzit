"use client";

import { create } from "zustand";
import { gradeQuestion } from "@/lib/scoring";
import { prepareSessionQuestions } from "@/lib/shuffle";
import { storage, type PersistedSession } from "@/lib/storage";
import type {
  Badge,
  Question,
  QuizAttempt,
  QuizSet,
  QuizSettings,
  UserAnswer,
} from "@/lib/types";
import { useLibrary } from "./useLibrary";

export interface CompletedSummary {
  attempt: QuizAttempt;
  questions: Question[];
  newlyUnlocked: Badge[];
  previousBest: number | null;
  previousLatest: number | null;
}

interface QuizSessionState {
  quizSetId: string | null;
  quizTitle: string;
  questions: Question[];
  settings: QuizSettings | null;
  currentIndex: number;
  answers: Record<string, UserAnswer>;
  startedAt: number;
  questionStartedAt: number;
  currentStreak: number;
  longestStreak: number;
  status: "idle" | "in_progress" | "finished";
  pendingResume: PersistedSession | null;
  lastCompleted: CompletedSummary | null;

  checkSavedSession: () => void;
  resumeSavedSession: () => void;
  discardSavedSession: () => void;
  startSession: (quizSet: QuizSet, settings: QuizSettings) => void;
  startRetryWrong: (
    quizSetId: string,
    quizTitle: string,
    wrongQuestions: Question[],
    settings: QuizSettings
  ) => void;
  submitAnswer: (questionId: string, response: UserAnswer["response"]) => UserAnswer;
  goToQuestion: (index: number) => void;
  next: () => void;
  prev: () => void;
  finishSession: () => CompletedSummary | null;
}

function persistCurrent(state: QuizSessionState) {
  if (
    state.status !== "in_progress" ||
    !state.quizSetId ||
    !state.settings
  ) {
    return;
  }
  storage.saveSession({
    quizSetId: state.quizSetId,
    quizTitle: state.quizTitle,
    questions: state.questions,
    settings: state.settings,
    currentIndex: state.currentIndex,
    answers: state.answers,
    startedAt: state.startedAt,
    currentStreak: state.currentStreak,
    longestStreak: state.longestStreak,
    status: "in_progress",
  });
}

export const useQuizSession = create<QuizSessionState>((set, get) => ({
  quizSetId: null,
  quizTitle: "",
  questions: [],
  settings: null,
  currentIndex: 0,
  answers: {},
  startedAt: 0,
  questionStartedAt: 0,
  currentStreak: 0,
  longestStreak: 0,
  status: "idle",
  pendingResume: null,
  lastCompleted: null,

  checkSavedSession: () => {
    const saved = storage.getSession();
    set({ pendingResume: saved });
  },

  resumeSavedSession: () => {
    const saved = get().pendingResume ?? storage.getSession();
    if (!saved) return;
    set({
      quizSetId: saved.quizSetId,
      quizTitle: saved.quizTitle,
      questions: saved.questions,
      settings: saved.settings,
      currentIndex: saved.currentIndex,
      answers: saved.answers,
      startedAt: saved.startedAt,
      questionStartedAt: Date.now(),
      currentStreak: saved.currentStreak,
      longestStreak: saved.longestStreak,
      status: "in_progress",
      pendingResume: null,
    });
  },

  discardSavedSession: () => {
    storage.saveSession(null);
    set({
      pendingResume: null,
      status: "idle",
      quizSetId: null,
      questions: [],
      answers: {},
    });
  },

  startSession: (quizSet, settings) => {
    const prepared = prepareSessionQuestions(quizSet.questions, settings);
    const now = Date.now();
    const nextState: Partial<QuizSessionState> = {
      quizSetId: quizSet.id,
      quizTitle: quizSet.title,
      questions: prepared,
      settings,
      currentIndex: 0,
      answers: {},
      startedAt: now,
      questionStartedAt: now,
      currentStreak: 0,
      longestStreak: 0,
      status: "in_progress",
      pendingResume: null,
      lastCompleted: null,
    };
    set(nextState);
    persistCurrent(get());
  },

  startRetryWrong: (quizSetId, quizTitle, wrongQuestions, settings) => {
    const now = Date.now();
    set({
      quizSetId,
      quizTitle: `${quizTitle} (Retry Mistakes)`,
      questions: wrongQuestions,
      settings: { ...settings, questionCount: "all" },
      currentIndex: 0,
      answers: {},
      startedAt: now,
      questionStartedAt: now,
      currentStreak: 0,
      longestStreak: 0,
      status: "in_progress",
      pendingResume: null,
      lastCompleted: null,
    });
    persistCurrent(get());
  },

  submitAnswer: (questionId, response) => {
    const state = get();
    const question = state.questions.find((q) => q.id === questionId);
    if (!question) {
      throw new Error(`Question ${questionId} not found in session`);
    }

    const { score, isCorrect } = gradeQuestion(question, response, {
      typoTolerance: state.settings?.typoTolerance,
    });

    const now = Date.now();
    const answer: UserAnswer = {
      questionId,
      response,
      score,
      isCorrect,
      timeMs: Math.max(0, now - state.questionStartedAt),
    };

    const nextAnswers = { ...state.answers, [questionId]: answer };
    let currentStreak = state.currentStreak;
    let longestStreak = state.longestStreak;

    if (isCorrect) {
      currentStreak += 1;
      if (currentStreak > longestStreak) longestStreak = currentStreak;
    } else {
      currentStreak = 0;
    }

    set({
      answers: nextAnswers,
      currentStreak,
      longestStreak,
    });
    persistCurrent(get());
    return answer;
  },

  goToQuestion: (index) => {
    const { questions } = get();
    if (index < 0 || index >= questions.length) return;
    set({ currentIndex: index, questionStartedAt: Date.now() });
    persistCurrent(get());
  },

  next: () => {
    const { currentIndex, questions } = get();
    if (currentIndex + 1 < questions.length) {
      set({ currentIndex: currentIndex + 1, questionStartedAt: Date.now() });
      persistCurrent(get());
    }
  },

  prev: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, questionStartedAt: Date.now() });
      persistCurrent(get());
    }
  },

  finishSession: () => {
    const state = get();
    if (!state.quizSetId || !state.settings || state.questions.length === 0) {
      return null;
    }

    const orderedAnswers: UserAnswer[] = state.questions.map((q) => {
      return (
        state.answers[q.id] ?? {
          questionId: q.id,
          response: q.type === "identification" ? "" : [],
          score: 0,
          isCorrect: false,
          timeMs: 0,
        }
      );
    });

    const totalScore = orderedAnswers.reduce((sum, a) => sum + a.score, 0);
    const accuracy = Math.round((totalScore / state.questions.length) * 100);

    // Recompute longest streak across ordered answers in case of end-mode edits
    let run = 0;
    let bestRun = 0;
    for (const a of orderedAnswers) {
      if (a.isCorrect) {
        run++;
        if (run > bestRun) bestRun = run;
      } else {
        run = 0;
      }
    }

    const attempt: QuizAttempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      quizSetId: state.quizSetId,
      quizTitle: state.quizTitle,
      settings: state.settings,
      answers: orderedAnswers,
      startedAt: state.startedAt,
      finishedAt: Date.now(),
      totalScore,
      accuracy,
      longestStreak: bestRun,
    };

    const { newlyUnlocked, previousBest, previousLatest } =
      useLibrary.getState().recordAttempt(attempt);

    const summary: CompletedSummary = {
      attempt,
      questions: state.questions,
      newlyUnlocked,
      previousBest,
      previousLatest,
    };

    storage.saveSession(null);
    set({
      status: "finished",
      pendingResume: null,
      lastCompleted: summary,
    });

    return summary;
  },
}));
