import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000")
  ),
  title: "Quizzit",
  description:
    "Bring your own question files, customize your quiz, and celebrate every milestone.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Quizzit",
  },
  icons: {
    apple: "/mascot/logo.png",
  },
  openGraph: {
    title: "Quizzit",
    description:
      "Bring your own question files, customize your quiz, and celebrate every milestone.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quizzit",
    description:
      "Bring your own question files, customize your quiz, and celebrate every milestone.",
  },
};

export const viewport: Viewport = {
  themeColor: "#225577",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
