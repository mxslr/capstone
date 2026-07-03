"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IconClose, IconMenu } from "@/components/icons";

const navItems = [
  { href: "/belajar", label: "Belajar" },
  { href: "/latihan", label: "Latihan" },
  { href: "/terjemah", label: "Terjemah" },
  { href: "/fitur", label: "Fitur" },
  { href: "/tentang", label: "Tentang" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight"
          onClick={() => setOpen(false)}
        >
          SAPA
        </Link>

        <nav className="hidden items-center gap-6 sm:flex" aria-label="Navigasi utama">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                pathname === item.href
                  ? "text-sm font-medium text-accent"
                  : "text-sm text-muted transition-colors hover:text-foreground"
              }
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/latihan"
            className="rounded-md bg-accent px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
          >
            Mulai belajar
          </Link>
        </nav>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center text-muted sm:hidden"
          aria-expanded={open}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <IconClose /> : <IconMenu />}
        </button>
      </div>

      {open && (
        <nav
          className="border-t border-border bg-background px-4 py-3 sm:hidden"
          aria-label="Navigasi utama"
        >
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={
                    pathname === item.href
                      ? "block rounded-md px-2 py-2 text-sm font-medium text-accent"
                      : "block rounded-md px-2 py-2 text-sm text-muted"
                  }
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/latihan"
                onClick={() => setOpen(false)}
                className="mt-1 block rounded-md bg-accent px-2 py-2 text-center text-sm font-medium text-white"
              >
                Mulai belajar
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
