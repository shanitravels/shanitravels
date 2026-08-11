"use client";

import { useActionState } from "react";
import { FiLock, FiAlertCircle } from "react-icons/fi";
import { login, type LoginState } from "@/lib/actions/auth";

const initial: LoginState = { error: null };

export function LoginForm({ from }: { from: string }) {
  const [state, formAction, pending] = useActionState(login, initial);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="from" value={from} />

      {state.error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <FiAlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
          placeholder="admin@shanitravels.pk"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light disabled:opacity-60"
      >
        <FiLock className="h-4 w-4" />
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
