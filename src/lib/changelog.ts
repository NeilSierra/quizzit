export const APP_VERSION = "v3.4";

export interface PatchNote {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const PATCH_NOTES: PatchNote[] = [
  {
    version: "v3.4",
    date: "2026-11-22",
    title: "About the Creator & Browser Favicon Fix",
    changes: [
      "Added an About the Creator section in Settings featuring @NeilSierra, Quizzit's story, tech stack pills, and a GitHub profile link, plus a quick footer link in the sidebar and Patch Notes modal.",
      "Added an explicit multi-size favicon.ico and <link rel=\"icon\"> metadata tags so the Quizzit icon displays reliably in all browser tabs.",
    ],
  },
  {
    version: "v3.3",
    date: "2026-11-22",
    title: "PWA App Icon & Mobile Adaptive Icon Fix",
    changes: [
      "Generated dedicated opaque 192x192, 512x512, maskable 512x512, and Apple Touch icons so the Quizzit logo no longer renders with a black background on Android or iOS home screens.",
      "Added proper safe-zone padding to the maskable PWA icon so the mascot stays centered and unclipped inside adaptive icon shapes.",
      "Updated the service worker precache and manifest to serve and cache the new PWA icon assets.",
    ],
  },
  {
    version: "v3.2",
    date: "2026-11-22",
    title: "Full Offline Mode & Auto-Sync Queue",
    changes: [
      "Added an offline mutation queue so quizzes imported, renamed, deleted, or completed offline automatically sync to Supabase when you reconnect.",
      "Precached quiz play, setup, results, and review shells in the service worker so every quiz in your library is playable offline.",
      "Updated the Offline Mode banner to show how many local changes are queued for sync.",
    ],
  },
  {
    version: "v3.1",
    date: "2026-11-22",
    title: "Offline Mode for PWA",
    changes: [
      "Upgraded the service worker to precache all core pages, RSC payloads, and mascot assets for offline navigation.",
      "Added automatic local mirror caching so signed-in users can access and play their library even without an internet connection.",
      "Added an Offline Mode status banner when the device disconnects.",
    ],
  },
  {
    version: "v3.0",
    date: "2026-11-22",
    title: "Installable PWA, Redemption Questions & Compact Library",
    changes: [
      "Made Quizzit an installable Progressive Web App (PWA) with offline caching and standalone app support on desktop and mobile.",
      "Added Redemption Questions: previously wrong answers automatically carry over into your next continue session until you master them.",
      "Redesigned Library quiz cards to be more compact with an icon-only Start button and a triple-dot actions menu (Rename, Export, Delete).",
      "Improved mobile responsiveness for all buttons and cards across every screen, and fixed the duplicate clear icon in the Library search bar.",
    ],
  },
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
