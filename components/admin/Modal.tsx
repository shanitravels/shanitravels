"use client";

import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { cn } from "@/lib/utils";

/**
 * Accessible slide-over panel used by every admin editor and detail view.
 *
 * Animation is driven by CSS keyframes (see `.drawer-panel-*` in globals.css),
 * not by transitioning a class after mount. The transition approach needs the
 * browser to paint the off-screen position before the class flips, and React
 * batches that update into the mounting render — so the panel appears already in
 * place and the opening animation silently never runs. A keyframe animation
 * plays on mount by definition.
 *
 * The panel also stays mounted for the length of the closing animation, or it
 * would vanish mid-slide instead of sliding away.
 */

/** Must match the animation durations in globals.css. */
const EXIT_MS = 380;

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  // Trails `open` on the way out so the closing animation can finish.
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      return;
    }
    const timer = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-slate-900/40",
          open ? "drawer-scrim-in" : "drawer-scrim-out"
        )}
      />
      <div
        className={cn(
          "relative flex h-full w-full max-w-lg flex-col bg-white shadow-lift",
          open ? "drawer-panel-in" : "drawer-panel-out"
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
