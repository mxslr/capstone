import type { LucideIcon } from "lucide-react";

/* Kepala halaman fitur: kartu putih polos dengan icon, judul, dan cakupan. */
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
    <header className="rounded-2xl border border-border bg-background p-7 sm:p-9">
      {Icon && <Icon size={26} className="text-accent" aria-hidden="true" />}
      <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h1>
      {scope && <p className="mt-1.5 text-xs font-medium text-accent">{scope}</p>}
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{description}</p>
    </header>
  );
}
