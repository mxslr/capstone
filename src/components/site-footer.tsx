import Link from "next/link";
import { SapaLogo } from "@/components/logo";

const columns = [
  {
    title: "Fitur",
    links: [
      { href: "/belajar", label: "Belajar" },
      { href: "/latihan", label: "Latihan" },
      { href: "/terjemah", label: "Terjemah" },
      { href: "/institusi", label: "Institusi" },
    ],
  },
  {
    title: "Info",
    links: [
      { href: "/fitur", label: "Semua fitur" },
      { href: "/tentang", label: "Tentang SAPA" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-[1.4fr_1fr_1fr] sm:px-6">
        <div>
          <SapaLogo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Platform belajar BISINDO. Cakupan saat ini alfabet dan 32 kosakata
            dasar, semua pemrosesan kamera terjadi di perangkatmu.
          </p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title} className="text-sm">
            <p className="font-medium">{col.title}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>SAPA. Bahasa Isyarat Indonesia.</p>
          <p>Materi menunggu validasi komunitas Tuli.</p>
        </div>
      </div>
    </footer>
  );
}
