import { CircleDot, ListOrdered, PenLine } from "lucide-react";
import type { QuestionType } from "@/lib/types";

interface QuestionTypeIconProps {
  type: QuestionType;
  className?: string;
}

export function QuestionTypeIcon({
  type,
  className = "h-4 w-4 shrink-0",
}: QuestionTypeIconProps) {
  switch (type) {
    case "multiple_choice":
      return <CircleDot className={className} aria-hidden="true" />;
    case "identification":
      return <PenLine className={className} aria-hidden="true" />;
    case "enumeration":
      return <ListOrdered className={className} aria-hidden="true" />;
  }
}
