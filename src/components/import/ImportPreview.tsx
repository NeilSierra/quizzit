"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { QuestionTypeIcon } from "@/components/QuestionTypeIcon";
import type { ImportResult } from "@/lib/types";

interface ImportPreviewProps {
  result: ImportResult;
  onConfirm: (title: string, description: string) => void;
  onCancel: () => void;
}

export function ImportPreview({
  result,
  onConfirm,
  onCancel,
}: ImportPreviewProps) {
  const [title, setTitle] = useState(result.title);
  const [description, setDescription] = useState(result.description ?? "");

  const mcCount = result.validQuestions.filter(
    (q) => q.type === "multiple_choice"
  ).length;
  const idCount = result.validQuestions.filter(
    (q) => q.type === "identification"
  ).length;
  const enumCount = result.validQuestions.filter(
    (q) => q.type === "enumeration"
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-7 w-7 text-success shrink-0" />
          <div>
            <h2 className="text-xl font-extrabold text-text">
              {result.validQuestions.length} valid{" "}
              {result.validQuestions.length === 1 ? "question" : "questions"}{" "}
              ready
            </h2>
            <p className="text-sm font-semibold text-text-muted">
              Out of {result.totalRows} total{" "}
              {result.totalRows === 1 ? "entry" : "entries"} detected
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-border bg-bg-subtle px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-text">
            <QuestionTypeIcon type="multiple_choice" className="h-3.5 w-3.5" />
            Multiple Choice: {mcCount}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-border bg-bg-subtle px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-text">
            <QuestionTypeIcon type="identification" className="h-3.5 w-3.5" />
            Identification: {idCount}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-border bg-bg-subtle px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-text">
            <QuestionTypeIcon type="enumeration" className="h-3.5 w-3.5" />
            Enumeration: {enumCount}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <Input
            label="Quiz Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Biology Chapter 3"
          />
          <Input
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short note about this set"
          />
        </div>
      </Card>

      {result.errors.length > 0 && (
        <Card className="border-danger bg-danger-bg/40">
          <div className="mb-3 flex items-center gap-2 text-danger">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <h3 className="font-extrabold">
              {result.errors.length}{" "}
              {result.errors.length === 1 ? "row has an issue" : "rows have issues"}
            </h3>
          </div>
          <ul className="max-h-56 space-y-1.5 overflow-y-auto text-sm font-semibold text-text">
            {result.errors.map((err, i) => (
              <li
                key={`${err.row}-${i}`}
                className="rounded-lg bg-surface/80 px-3 py-2 border border-border"
              >
                {err.message}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={result.validQuestions.length === 0 || !title.trim()}
          onClick={() => onConfirm(title.trim(), description.trim())}
        >
          Import {result.validQuestions.length} Valid Questions
        </Button>
      </div>
    </div>
  );
}
