"use client";

import { Modal } from "./modal";
import { Button } from "./button";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default" | "success";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = "Konfirmasi Tindakan",
  description,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const icon =
    variant === "danger" ? (
      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
        <AlertTriangle size={20} />
      </div>
    ) : variant === "success" ? (
      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
        <CheckCircle2 size={20} />
      </div>
    ) : (
      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
        <Info size={20} />
      </div>
    );

  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <div className="space-y-4 pt-1">
        <div className="flex items-start gap-3">
          {icon}
          <div className="text-sm text-slate-600 pt-1 leading-relaxed">
            {description}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "default"}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
