export type QuestionType = "multiple_choice" | "identification" | "enumeration";

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  hint?: string;
  explanation?: string;
  tags?: string[];
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple_choice";
  choices: string[];
  answer: number[];
  multiSelect?: boolean;
}

export interface IdentificationQuestion extends BaseQuestion {
  type: "identification";
  answers: string[];
  caseSensitive?: boolean;
}

export interface EnumerationQuestion extends BaseQuestion {
  type: "enumeration";
  answers: string[];
  count?: number;
  ordered?: boolean;
}

export type Question =
  | MultipleChoiceQuestion
  | IdentificationQuestion
  | EnumerationQuestion;

export interface QuizSet {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  questions: Question[];
}

export interface QuizSettings {
  types: QuestionType[];
  targetMode?: "original" | QuestionType;
  shuffleQuestions: boolean;
  shuffleChoices: boolean;
  questionCount: number | "all";
  feedbackMode: "immediate" | "end";
  timerMinutes?: number;
  typoTolerance?: boolean;
}

export interface UserAnswer {
  questionId: string;
  response: number[] | string | string[];
  score: number;
  isCorrect: boolean;
  timeMs: number;
}

export interface QuizAttempt {
  id: string;
  quizSetId: string;
  quizTitle: string;
  settings: QuizSettings;
  answers: UserAnswer[];
  startedAt: number;
  finishedAt: number;
  totalScore: number;
  accuracy: number;
  longestStreak: number;
}

export type BadgeId =
  | "first_quiz"
  | "perfect_score"
  | "comeback_20"
  | "speed_demon";

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
}

export interface UserStats {
  unlockedBadges: BadgeId[];
}

export interface ImportError {
  row: number;
  message: string;
}

export interface ImportResult {
  title: string;
  description?: string;
  validQuestions: Question[];
  errors: ImportError[];
  totalRows: number;
}

export type ThemePreference = "system" | "light" | "dark";
export type UiScale = "compact" | "default" | "large";
