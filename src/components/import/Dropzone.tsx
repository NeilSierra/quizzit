"use client";

import { useRef, useState, type DragEvent } from "react";
import { FileSpreadsheet, FileJson, Upload } from "lucide-react";
import { MAX_FILE_SIZE_BYTES } from "@/lib/schema";

interface DropzoneProps {
  onFileLoaded: (fileName: string, content: string, ext: "json" | "csv") => void;
  onError: (message: string) => void;
}

export function Dropzone({ onFileLoaded, onError }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      onError("File exceeds the 2 MB limit. Please split it into smaller sets.");
      return;
    }

    const lower = file.name.toLowerCase();
    const ext = lower.endsWith(".json")
      ? "json"
      : lower.endsWith(".csv")
      ? "csv"
      : null;

    if (!ext) {
      onError("Unsupported file type. Please upload a .json or .csv file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onFileLoaded(file.name, String(reader.result ?? ""), ext);
    };
    reader.onerror = () => {
      onError("Could not read the selected file.");
    };
    reader.readAsText(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={`focus-ring flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-colors ${
        dragging
          ? "border-brand-fill bg-brand-tint"
          : "border-border-strong bg-surface hover:border-brand-fill hover:bg-bg-subtle"
      }`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-tint text-brand-text">
        <Upload className="h-8 w-8" />
      </div>
      <div>
        <p className="text-xl font-extrabold text-text">
          Drop your question file here
        </p>
        <p className="mt-1 text-sm font-semibold text-text-muted">
          or click to browse — supports{" "}
          <span className="inline-flex items-center gap-1 font-bold text-text">
            <FileJson className="h-3.5 w-3.5" /> .json
          </span>{" "}
          and{" "}
          <span className="inline-flex items-center gap-1 font-bold text-text">
            <FileSpreadsheet className="h-3.5 w-3.5" /> .csv
          </span>{" "}
          (max 2 MB)
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".json,.csv,application/json,text/csv"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
