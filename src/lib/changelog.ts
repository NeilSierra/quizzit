export const APP_VERSION = "v2.4";

export interface PatchNote {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const PATCH_NOTES: PatchNote[] = [
  {
    version: "v2.4",
    date: "2026-11-22",
    title: "Social Share Preview (Open Graph Image)",
    changes: [
      "Added a 1200×630 Open Graph & Twitter preview image featuring the Quizzit mascot and tagline when sharing links.",
    ],
  },
  {
    version: "v2.3",
    date: "2026-11-22",
    title: "Continue Unquizzed Questions",
    changes: [
      "Added a 'Continue unquizzed questions only' toggle in Quiz Setup when a quiz has remaining unquizzed items.",
      "Added a 'Continue Unquizzed Questions' button on the Results screen to jump straight into the remaining questions.",
    ],
  },
  {
    version: "v2.2",
    date: "2026-11-21",
    title: "Max Questions Default & Feedback Polish",
    changes: [
      "Set Number of Questions in the AI Prompt Guide to Max by default.",
      "Added Idea, Bug, and Love it icons to the Feedback modal categories and defaulted star rating to 0.",
    ],
  },
  {
    version: "v2.1",
    date: "2026-11-21",
    title: "Mobile Hamburger Menu, Likes & Feedback",
    changes: [
      "Added an app-wide Like counter and Feedback form (with category and 1–5 star rating) on the Home screen, backed by Supabase.",
      "Replaced the mobile top-bar action icons with an absolute, floating hamburger menu containing Help & Quiz Guide, Account, Theme, and Patch Notes.",
      "Updated Account display to show your name instead of your full email address.",
    ],
  },
  {
    version: "v2.0",
    date: "2026-11-21",
    title: "Private Cloud Sync, Google Auth & Help Guide",
    changes: [
      "Added Supabase Authentication (Email/Password & Google Sign-In) with strict Row-Level Security—every user's library, attempts, and badges stay 100% private with no shared library.",
      "Added automatic cloud sync when signed in and a one-time Guest Merge modal to import local quizzes into your account.",
      "Added a Help & Quiz Guide page (/help) explaining how to use Quizzit, keyboard shortcuts, and CSV/JSON formatting.",
      "Added question-type icons across setup, import, and quiz play, plus icons and 8-character password validation in the Account modal.",
      "Improved tablet responsiveness across Settings, Library, Setup, Home, and the AI Prompt Guide, and updated the prompt to ask for plausible, closely related wrong choices.",
    ],
  },
  {
    version: "v1.1",
    date: "2026-11-21",
    title: "CSV-First Prompt, Library Search & Patch Notes",
    changes: [
      "Set CSV as the default output format in the AI Prompt Guide.",
      "Updated the AI prompt to request a downloadable .csv or .json file directly from the chatbot.",
      "Added a search bar in the Library to filter quizzes by title or description.",
      "Added a full-width Patch Notes button at the bottom of the sidebar and a Patch Notes section in Settings (showing 3 releases at a time).",
    ],
  },
  {
    version: "v1.0",
    date: "2026-11-21",
    title: "Initial Release",
    changes: [
      "Local-first JSON and CSV quiz import with live preview and row-level error checking.",
      "Multiple Choice, Identification, and Enumeration questions with cross-mode conversion.",
      "Immediate and At-the-End feedback modes, learning hints, and synthesized sound effects.",
      "Light/Dark/System themes, adjustable UI size, badges, history, and JSON backup export/import.",
    ],
  },
];
