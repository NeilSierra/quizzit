"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Dropzone } from "@/components/import/Dropzone";
import { ImportPreview } from "@/components/import/ImportPreview";
import { PromptGuide } from "@/components/import/PromptGuide";
import { Card } from "@/components/ui/Card";
import { parseCsvImport } from "@/lib/parsers/csv";
import { parseJsonImport } from "@/lib/parsers/json";
import type { ImportResult } from "@/lib/types";
import { useLibrary } from "@/store/useLibrary";

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
