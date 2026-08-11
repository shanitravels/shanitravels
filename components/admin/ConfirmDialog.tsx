"use client";

import { useEffect, useRef, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";

interface ConfirmProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  /** When set, the user must type this exact string to enable confirmation. */
  requireTyped?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Accessible confirmation modal; supports typed-confirmation for hard deletes. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  destructive = false,
  requireTyped,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  const [typed, setTyped] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Reset the typed-confirmation whenever the dialog transitions to open
  // (adjust-state-during-render pattern — no effect needed).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setTyped("");
  }

  // Focus management + Escape-to-close (DOM side effects).
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const canConfirm = !pending && (!requireTyped || typed === requireTyped);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lift">
        <div className="flex items-start gap-3">
          {destructive && (
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <FiAlertTriangle className="h-5 w-5" />
            </span>
          )}
          <div className="flex-1">
            <h2 id="confirm-title" className="text-base font-semibold text-slate-900">
              {title}
            </h2>
            <div className="mt-1 text-sm text-slate-600">{message}</div>
          </div>
        </div>

        {requireTyped && (
          <div className="mt-4">
            <label className="text-xs font-medium text-slate-600">
              Type <span className="font-mono font-semibold text-slate-900">{requireTyped}</span> to
              confirm
            </label>
            <input
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              destructive ? "bg-red-600 hover:bg-red-700" : "bg-navy hover:bg-navy-light"
            }`}
          >
            {pending ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
