import { Suspense } from "react";
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Quizzit",
  description:
    "Bring your own question files, customize your quiz, and celebrate every milestone.",
};

const THEME_INIT_SCRIPT = `
(function() {
  try {
    var t = localStorage.getItem('quizapp:theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
    }
    var s = localStorage.getItem('quizapp:ui-scale');
    if (s === 'compact' || s === 'default' || s === 'large') {
      document.documentElement.setAttribute('data-ui-scale', s);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <Suspense fallback={<div className="min-h-screen bg-bg" />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
