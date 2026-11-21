"use client";

import { CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { storage } from "@/lib/storage";
import { sound } from "@/lib/sound";
import { useAuth } from "@/store/useAuth";

export function GuestMergeModal() {
  const open = useAuth((s) => s.pendingGuestMerge);
  const syncing = useAuth((s) => s.syncing);
  const mergeGuestData = useAuth((s) => s.mergeGuestData);
  const dismissGuestMerge = useAuth((s) => s.dismissGuestMerge);

  const localCount = typeof window !== "undefined" ? storage.getLibrary().length : 0;

  return (
    <Modal
      open={open}
      onClose={dismissGuestMerge}
      title="Sync Local Quizzes?"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand-text">
            <CloudUpload className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-text-muted">
            You have <strong className="text-text">{localCount}</strong>{" "}
            {localCount === 1 ? "quiz" : "quizzes"} saved on this device from
            guest mode. Would you like to merge them into your private account?
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="secondary" onClick={dismissGuestMerge}>
            Keep Separate
          </Button>
          <Button
            variant="primary"
            disabled={syncing}
            onClick={async () => {
              await mergeGuestData();
              sound.playCorrect();
            }}
          >
            {syncing ? "Syncing..." : "Merge Into Account"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
