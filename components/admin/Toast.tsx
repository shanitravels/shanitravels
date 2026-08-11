"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { FiCheckCircle, FiAlertCircle, FiX, FiInfo } from "react-icons/fi";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  toast: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Toast provider mounted at the admin layout root. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, kind, message }]);
      setTimeout(() => remove(id), 4500);
    },
    [remove]
  );

  const api: ToastApi = {
    toast,
    success: (m) => toast(m, "success"),
    error: (m) => toast(m, "error"),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex w-[min(92vw,22rem)] flex-col gap-2"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lift ${
              t.kind === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : t.kind === "error"
                  ? "border-red-200 bg-red-50 text-red-900"
                  : "border-slate-200 bg-white text-slate-800"
            }`}
          >
            <span className="mt-0.5 shrink-0">
              {t.kind === "success" ? (
                <FiCheckCircle className="h-4 w-4" />
              ) : t.kind === "error" ? (
                <FiAlertCircle className="h-4 w-4" />
              ) : (
                <FiInfo className="h-4 w-4" />
              )}
            </span>
            <p className="flex-1 leading-snug">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="shrink-0 rounded p-0.5 opacity-60 transition hover:opacity-100"
              aria-label="Dismiss"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
