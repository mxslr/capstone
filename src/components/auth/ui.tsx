"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SapaMark } from "@/components/logo";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center px-4 py-14">
      <Link href="/" aria-label="Beranda KawanTuli" className="mb-6 inline-block w-fit">
        <SapaMark className="h-9 w-9" />
      </Link>
      <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
      <div className="mt-7">{children}</div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm transition-colors placeholder:text-slate-400 focus:border-accent focus:outline-none";

export function SubmitButton({
  children,
  loading,
}: {
  children: ReactNode;
  loading?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
    >
      {loading ? "Memproses..." : children}
    </button>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      {message}
    </p>
  );
}

export function FormNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="status" className="rounded-lg bg-accent-soft px-3.5 py-2.5 text-sm text-accent-strong">
      {message}
    </p>
  );
}

export function Divider() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted">
      <span className="h-px flex-1 bg-border" />
      atau
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function GoogleButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface disabled:opacity-60"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.45a5.5 5.5 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.8Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.29 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.28a12 12 0 0 0 0 10.74l4.01-3.1Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.78c1.76 0 3.34.6 4.59 1.79l3.44-3.44A12 12 0 0 0 1.28 6.63l4.01 3.1C6.23 6.89 8.88 4.78 12 4.78Z"
        />
      </svg>
      Lanjutkan dengan Google
    </button>
  );
}
