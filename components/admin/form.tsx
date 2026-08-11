"use client";

import { clsx } from "clsx";

/** Shared form primitives for admin CRUD forms. Colocated for consistency. */

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string[];
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error?.length && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error?.length ? <p className="mt-1 text-xs text-red-600">{error[0]}</p> : null}
    </div>
  );
}

const baseControl =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2";

export function TextInput({
  invalid,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      className={clsx(
        baseControl,
        invalid
          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
          : "border-slate-300 focus:border-navy focus:ring-navy/20",
        className
      )}
    />
  );
}

export function TextArea({
  invalid,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      {...props}
      className={clsx(
        baseControl,
        "min-h-[100px] resize-y",
        invalid
          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
          : "border-slate-300 focus:border-navy focus:ring-navy/20",
        className
      )}
    />
  );
}

export function Select({
  invalid,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      {...props}
      className={clsx(
        baseControl,
        invalid
          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
          : "border-slate-300 focus:border-navy focus:ring-navy/20",
        className
      )}
    >
      {children}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50",
        checked ? "bg-navy" : "bg-slate-300"
      )}
    >
      <span
        className={clsx(
          "inline-block h-4 w-4 transform rounded-full bg-white transition",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  pending,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  pending?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || pending}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
        variant === "primary" && "bg-navy text-white hover:bg-navy-light",
        variant === "secondary" && "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        className
      )}
    >
      {pending ? "Working…" : children}
    </button>
  );
}

/**
 * A bilingual text field: one control per language, stacked.
 *
 * Both sides are edited together so a translation cannot silently drift from
 * the English it belongs to. The Urdu control keeps the page's LTR direction
 * rather than flipping to RTL — the public site renders Urdu inside LTR blocks
 * (see app/globals.css), so matching that here means what the editor types is
 * laid out exactly as visitors will see it.
 *
 * A form using this submits both sides, so its collection must be listed in
 * BILINGUAL_EDITORS (lib/actions/content.ts). That switches off the
 * `preserveUrdu()` merge, which exists for the English-only forms — leaving it
 * on here would quietly undo a translation the editor meant to clear.
 */
export function LocalizedField({
  label,
  hint,
  required,
  error,
  value,
  onChange,
  multiline = false,
  rows,
  maxLength,
  className,
  controlClassName,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string[];
  value: { en: string; ur: string };
  onChange: (next: { en: string; ur: string }) => void;
  multiline?: boolean;
  rows?: number;
  /** English budget. Urdu gets double, matching `localizedText` in lib/validation. */
  maxLength?: number;
  className?: string;
  controlClassName?: string;
}) {
  const Control = multiline ? TextArea : TextInput;
  const invalid = !!error?.length;

  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      <div className="space-y-1.5">
        <div className="flex items-start gap-2">
          <span className="mt-2 w-7 shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            EN
          </span>
          <Control
            value={value.en}
            onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) =>
              onChange({ ...value, en: e.target.value })
            }
            invalid={invalid}
            rows={rows}
            maxLength={maxLength}
            className={controlClassName}
          />
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-2 w-7 shrink-0 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
            UR
          </span>
          <Control
            value={value.ur}
            onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) =>
              onChange({ ...value, ur: e.target.value })
            }
            lang="ur"
            placeholder="اردو ترجمہ"
            rows={rows}
            maxLength={maxLength ? maxLength * 2 : undefined}
            className={clsx("font-urdu leading-loose", controlClassName)}
          />
        </div>
      </div>

      {hint && !invalid && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {invalid ? <p className="mt-1 text-xs text-red-600">{error![0]}</p> : null}
    </div>
  );
}
