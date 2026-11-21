export const APP_VERSION = "v1.1";

export interface PatchNote {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const PATCH_NOTES: PatchNote[] = [
  {
    version: "v1.1",
    date: "2026-11-21",
    title: "CSV-First Prompt, Library Search & Patch Notes",
    changes: [
      "Set CSV as the default output format in the AI Prompt Guide.",
      "Updated the AI prompt to request a downloadable .csv or .json file directly from the chatbot.",
      "Added a search bar in the Library to filter quizzes by title or description.",
      "Added a full-width Patch Notes (v1.1) button at the bottom of the sidebar and a Patch Notes section in Settings (showing 3 releases at a time).",
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
