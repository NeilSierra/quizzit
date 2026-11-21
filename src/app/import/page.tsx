"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Download } from "lucide-react";
import { Dropzone } from "@/components/import/Dropzone";
import { ImportPreview } from "@/components/import/ImportPreview";
import { PromptGuide } from "@/components/import/PromptGuide";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CSV_TEMPLATE, parseCsvImport } from "@/lib/parsers/csv";
import { JSON_TEMPLATE, parseJsonImport } from "@/lib/parsers/json";
import type { ImportResult } from "@/lib/types";
import { useLibrary } from "@/store/useLibrary";

function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportPage() {
  const router = useRouter();
  const addQuizSet = useLibrary((s) => s.addQuizSet);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileLoaded = (
    fileName: string,
    content: string,
    ext: "json" | "csv"
  ) => {
    setErrorMsg(null);
    const baseName = fileName.replace(/\.(json|csv)$/i, "");
    const result =
      ext === "json"
        ? parseJsonImport(content, baseName)
        : parseCsvImport(content, baseName);
    setPreview(result);
  };

  const handleConfirm = (title: string, description: string) => {
    if (!preview || preview.validQuestions.length === 0) return;
    const created = addQuizSet(title, preview.validQuestions, description);
    router.push(`/quiz/${created.id}/setup`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold text-text">Import a Quiz</h1>
        <p className="mt-1 text-base font-semibold text-text-muted">
          Upload a JSON or CSV question file. Everything stays on your device.
        </p>
      </div>

      {errorMsg && (
        <Card className="border-danger bg-danger-bg/50 flex items-center gap-3 text-danger">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-bold text-sm">{errorMsg}</p>
        </Card>
      )}

      {!preview ? (
        <>
          <Dropzone
            onFileLoaded={handleFileLoaded}
            onError={(msg) => setErrorMsg(msg)}
          />

          <Card className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-text">
                Need a starting template?
              </h2>
              <p className="text-sm font-semibold text-text-muted">
                Download a sample file to see the exact format for Multiple
                Choice, Identification, and Enumeration questions.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-3">
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() =>
                  downloadTextFile(
                    "quizzit-template.json",
                    JSON_TEMPLATE,
                    "application/json"
                  )
                }
              >
                <Download className="h-4 w-4" />
                JSON Template
              </Button>
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() =>
                  downloadTextFile(
                    "quizzit-template.csv",
                    CSV_TEMPLATE,
                    "text/csv"
                  )
                }
              >
                <Download className="h-4 w-4" />
                CSV Template
              </Button>
            </div>
          </Card>

          <PromptGuide />
        </>
      ) : (
        <ImportPreview
          result={preview}
          onConfirm={handleConfirm}
          onCancel={() => {
            setPreview(null);
            setErrorMsg(null);
          }}
        />
      )}
    </div>
  );
}
