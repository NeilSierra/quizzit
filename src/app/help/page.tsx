"use client";

import Link from "next/link";
import {
  Cloud,
  FileJson,
  FileSpreadsheet,
  Keyboard,
  Lightbulb,
  Play,
  Sparkles,
  Upload,
} from "lucide-react";
import { QuestionTypeIcon } from "@/components/QuestionTypeIcon";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function HelpPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text">
            Help &amp; Quiz Guide
          </h1>
          <p className="text-base font-semibold text-text-muted">
            Learn how to use Quizzit and create your own CSV or JSON quizzes.
          </p>
        </div>
        <Link href="/import" className="w-full sm:w-auto shrink-0">
          <Button variant="primary" className="w-full sm:w-auto">
            <Upload className="h-4 w-4" />
            Go to Import
          </Button>
        </Link>
      </div>

      {/* How to Use Quizzit */}
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-extrabold text-text">
          How to Use Quizzit
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 text-brand-text">
              <Upload className="h-5 w-5 shrink-0" />
              <h3 className="text-lg font-extrabold text-text">
                1. Import or Generate Questions
              </h3>
            </div>
            <p className="text-sm font-semibold text-text-muted">
              Head to <strong>Import</strong> to drop in a{" "}
              <code className="font-mono text-text">.csv</code> or{" "}
              <code className="font-mono text-text">.json</code> file. Don&apos;t
              have a file yet? Use the built-in <strong>AI Prompt Guide</strong>{" "}
              to turn your PDFs, PowerPoint slides, or notes into a downloadable
              quiz file.
            </p>
          </Card>

          <Card className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 text-brand-text">
              <Play className="h-5 w-5 shrink-0" />
              <h3 className="text-lg font-extrabold text-text">
                2. Customize Your Practice
              </h3>
            </div>
            <p className="text-sm font-semibold text-text-muted">
              Pick any quiz from your <strong>Library</strong> to choose{" "}
              <strong>Question Mode</strong> (keep as imported or convert to
              Multiple Choice, Identification, or Enumeration), shuffle order,
              set a question count, or add a countdown timer.
            </p>
          </Card>

          <Card className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 text-brand-text">
              <Lightbulb className="h-5 w-5 shrink-0" />
              <h3 className="text-lg font-extrabold text-text">
                3. Use Hints &amp; Review Mistakes
              </h3>
            </div>
            <p className="text-sm font-semibold text-text-muted">
              Tap <strong>Hint</strong> anytime during a quiz to eliminate a
              wrong choice or reveal letters/items. After finishing, review
              explanations or tap <strong>Retry Wrong Answers Only</strong>.
            </p>
          </Card>

          <Card className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 text-brand-text">
              <Cloud className="h-5 w-5 shrink-0" />
              <h3 className="text-lg font-extrabold text-text">
                4. Private Sync (Optional)
              </h3>
            </div>
            <p className="text-sm font-semibold text-text-muted">
              Quizzit works offline in guest mode using your browser. Sign in
              via <strong>Account</strong> (Email or Google) to sync your
              private library and attempts across devices—nothing is shared
              publicly.
            </p>
          </Card>
        </div>
      </section>

      {/* Keyboard Shortcuts */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Keyboard className="h-6 w-6 text-brand-text" />
          <h2 className="text-2xl font-extrabold text-text">
            Keyboard Shortcuts
          </h2>
        </div>
        <Card className="grid gap-3 sm:grid-cols-3 text-sm font-semibold text-text-muted">
          <div>
            <code className="rounded-lg border border-border bg-bg-subtle px-2 py-0.5 font-mono font-extrabold text-text">
              1 – 9
            </code>{" "}
            Pick a multiple-choice option
          </div>
          <div>
            <code className="rounded-lg border border-border bg-bg-subtle px-2 py-0.5 font-mono font-extrabold text-text">
              Enter
            </code>{" "}
            Check answer / Continue
          </div>
          <div>
            <code className="rounded-lg border border-border bg-bg-subtle px-2 py-0.5 font-mono font-extrabold text-text">
              ← / →
            </code>{" "}
            Navigate in At-the-End mode
          </div>
        </Card>
      </section>

      {/* Question Types */}
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-extrabold text-text">Question Types</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="flex flex-col gap-2">
            <div className="flex items-center gap-2 font-extrabold text-text">
              <QuestionTypeIcon type="multiple_choice" />
              <h3>Multiple Choice</h3>
            </div>
            <p className="text-sm font-semibold text-text-muted">
              2 to 8 choices with one or more correct answers. Supports
              randomized choice order.
            </p>
          </Card>

          <Card className="flex flex-col gap-2">
            <div className="flex items-center gap-2 font-extrabold text-text">
              <QuestionTypeIcon type="identification" />
              <h3>Identification</h3>
            </div>
            <p className="text-sm font-semibold text-text-muted">
              Short typed answer. Accepts multiple valid answers and optional
              typo tolerance.
            </p>
          </Card>

          <Card className="flex flex-col gap-2">
            <div className="flex items-center gap-2 font-extrabold text-text">
              <QuestionTypeIcon type="enumeration" />
              <h3>Enumeration</h3>
            </div>
            <p className="text-sm font-semibold text-text-muted">
              List 2 or more items. Awards partial credit and prevents duplicate
              counting.
            </p>
          </Card>
        </div>
      </section>

      {/* How to Make a Quiz File */}
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-extrabold text-text">
          How to Make a Quiz File
        </h2>

        <Card className="border-brand-fill/50 bg-brand-tint/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-6 w-6 shrink-0 text-brand-text mt-0.5" />
            <div>
              <h3 className="font-extrabold text-text">
                Fastest Way: AI Prompt Guide
              </h3>
              <p className="text-sm font-semibold text-text-muted">
                Copy our pre-formatted prompt on the Import page and paste it
                into ChatGPT, Gemini, Claude, or DeepSeek with your notes or
                slides.
              </p>
            </div>
          </div>
          <Link href="/import" className="w-full sm:w-auto shrink-0">
            <Button variant="primary" className="w-full sm:w-auto">Open Prompt Guide</Button>
          </Link>
        </Card>

        {/* CSV Format */}
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-brand-text" />
            <h3 className="text-lg font-extrabold text-text">
              CSV Format (Excel / Google Sheets)
            </h3>
          </div>
          <p className="text-sm font-semibold text-text-muted">
            Use <code className="font-mono text-text">|</code> to separate
            multiple values inside a cell. Multiple-choice{" "}
            <code className="font-mono text-text">answer</code> numbers are{" "}
            <strong>1-based</strong> (e.g.{" "}
            <code className="font-mono text-text">2</code> for the second
            choice, or <code className="font-mono text-text">1|3</code> for
            multi-select).
          </p>
          <pre className="overflow-x-auto rounded-xl border-2 border-border bg-bg-subtle p-3 font-mono text-xs text-text whitespace-pre">
{`type,prompt,choices,answer,explanation
multiple_choice,"Which organelle produces most ATP?",Nucleus|Mitochondrion|Ribosome|Golgi,2,"Mitochondria make ATP"
identification,"Process plants use to make food from sunlight",,Photosynthesis|Photosynthesis process,"Happens in chloroplasts"
enumeration,"Name the parts of an ATP molecule",,Adenine|Ribose|Phosphate groups,`}
          </pre>
        </Card>

        {/* JSON Format */}
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-brand-text" />
            <h3 className="text-lg font-extrabold text-text">JSON Format</h3>
          </div>
          <p className="text-sm font-semibold text-text-muted">
            Multiple-choice <code className="font-mono text-text">answer</code>{" "}
            indices in JSON are <strong>0-based</strong> (e.g.{" "}
            <code className="font-mono text-text">[1]</code> for the second
            choice). Optional <code className="font-mono text-text">hint</code>{" "}
            and <code className="font-mono text-text">explanation</code> fields
            are supported on every question.
          </p>
          <pre className="overflow-x-auto rounded-xl border-2 border-border bg-bg-subtle p-3 font-mono text-xs text-text whitespace-pre">
{`{
  "title": "Biology: Cell Structure",
  "questions": [
    {
      "type": "multiple_choice",
      "prompt": "Which organelle produces most of the cell's ATP?",
      "choices": ["Nucleus", "Mitochondrion", "Ribosome", "Golgi"],
      "answer": [1],
      "hint": "Often called the powerhouse of the cell.",
      "explanation": "Mitochondria carry out oxidative phosphorylation."
    }
  ]
}`}
          </pre>
        </Card>
      </section>
    </div>
  );
}
