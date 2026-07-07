import type { LucideIcon } from "lucide-react";

/* Kepala halaman fitur: band gradasi lembut dengan icon, judul, dan cakupan. */
export function PageHeader({
  icon: Icon,
  title,
  scope,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  scope?: string;
  description: string;
}) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent-soft via-background to-background p-7 sm:p-9">
      <svg
        viewBox="0 0 200 60"
        className="pointer-events-none absolute -right-6 bottom-0 w-56 opacity-40"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 45C40 15 70 15 100 35C130 55 165 55 200 20"
          stroke="#22d3ee"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="relative">
        {Icon && <Icon size={26} className="text-accent" aria-hidden="true" />}
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {scope && <p className="mt-1.5 text-xs font-medium text-accent">{scope}</p>}
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </header>
  );
}
