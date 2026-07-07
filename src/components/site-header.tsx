"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Menu, Settings, User, X } from "lucide-react";
import type { User as AuthUser } from "@supabase/supabase-js";
import { SapaLogo } from "@/components/logo";
import { getSupabase } from "@/lib/supabase";

type MenuGroup = {
  label: string;
  items: { href: string; label: string; desc: string }[];
};

const groups: MenuGroup[] = [
  {
    label: "Belajar",
    items: [
      { href: "/belajar", label: "Materi isyarat", desc: "Avatar memperagakan huruf dan kata" },
      { href: "/belajar/kuis", label: "Kuis harian", desc: "Pengulangan terjadwal" },
    ],
  },
  {
    label: "Latihan",
    items: [
      { href: "/latihan", label: "Practice Arena", desc: "Latihan alfabet dengan kamera" },
      { href: "/latihan/roleplay", label: "Roleplay", desc: "Simulasi percakapan di apotek" },
    ],
  },
];

const links = [
  { href: "/terjemah", label: "Terjemah" },
  { href: "/fitur", label: "Fitur" },
  { href: "/tentang", label: "Tentang" },
];

function Avatar({ url, size = 32 }: { url: string | null; size?: number }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt="Foto profil"
        width={size}
        height={size}
        className="rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <span
      className="flex items-center justify-center rounded-full bg-slate-200 text-slate-500"
      style={{ width: size, height: size }}
    >
      <User size={size * 0.55} aria-hidden="true" />
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  function closeMenus() {
    setMobileOpen(false);
    setOpenMenu(null);
  }

  useEffect(() => {
    if (!openMenu) return;
    function onPointerDown(e: PointerEvent) {
      if (!barRef.current?.contains(e.target as Node)) setOpenMenu(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  async function signOut() {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    setOpenMenu(null);
    router.push("/");
    router.refresh();
  }

  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ??
    (user?.user_metadata?.picture as string | undefined) ??
    null;
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div
        ref={barRef}
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
      >
        <Link href="/" aria-label="Beranda SAPA">
          <SapaLogo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
          {groups.map((group) => {
            const active = group.items.some((i) => pathname === i.href);
            const open = openMenu === group.label;
            return (
              <div key={group.label} className="relative">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenMenu(open ? null : group.label)}
                  className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm transition-colors ${
                    active ? "font-medium text-accent" : "text-muted hover:text-foreground"
                  }`}
                >
                  {group.label}
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
                {open && (
                  <div className="menu-panel absolute left-0 top-full mt-2 w-64 rounded-xl border border-border bg-background p-1.5 shadow-lg shadow-slate-900/5">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenus}
                        className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-surface"
                      >
                        <span className="block text-sm font-medium">{item.label}</span>
                        <span className="mt-0.5 block text-xs text-muted">{item.desc}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                pathname === link.href
                  ? "font-medium text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <div className="relative">
              <button
                type="button"
                aria-expanded={openMenu === "user"}
                aria-label="Menu akun"
                onClick={() => setOpenMenu(openMenu === "user" ? null : "user")}
                className="flex items-center gap-1.5 rounded-full p-1 transition-colors hover:bg-surface"
              >
                <Avatar url={avatarUrl} />
                <ChevronDown
                  size={14}
                  className={`text-muted transition-transform duration-200 ${
                    openMenu === "user" ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>
              {openMenu === "user" && (
                <div className="menu-panel absolute right-0 top-full mt-2 w-60 rounded-xl border border-border bg-background p-1.5 shadow-lg shadow-slate-900/5">
                  <p className="truncate px-3 pb-2 pt-2.5 text-sm font-medium">{displayName}</p>
                  <div className="border-t border-border pt-1.5">
                    <Link
                      href="/akun"
                      onClick={closeMenus}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface"
                    >
                      <Settings size={16} className="text-muted" aria-hidden="true" />
                      Pengaturan akun
                    </Link>
                    <button
                      type="button"
                      onClick={signOut}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface"
                    >
                      <LogOut size={16} className="text-muted" aria-hidden="true" />
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/masuk"
                className="rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
              >
                Masuk
              </Link>
              <Link
                href="/daftar"
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
              >
                Daftar
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center text-muted md:hidden"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <nav
          className="fade-in border-t border-border bg-background px-4 pb-4 pt-2 md:hidden"
          aria-label="Navigasi utama"
        >
          {groups.map((group) => (
            <div key={group.label} className="py-1.5">
              <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted">
                {group.label}
              </p>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenus}
                  className={`block rounded-md px-2 py-2 text-sm ${
                    pathname === item.href ? "font-medium text-accent" : "text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
          <div className="border-t border-border py-1.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenus}
                className={`block rounded-md px-2 py-2 text-sm ${
                  pathname === link.href ? "font-medium text-accent" : "text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-border pt-3">
            {user ? (
              <>
                <div className="flex items-center gap-2.5 px-2 pb-2">
                  <Avatar url={avatarUrl} size={28} />
                  <span className="truncate text-sm font-medium">{displayName}</span>
                </div>
                <Link
                  href="/akun"
                  onClick={closeMenus}
                  className="block rounded-md px-2 py-2 text-sm"
                >
                  Pengaturan akun
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="block w-full rounded-md px-2 py-2 text-left text-sm"
                >
                  Keluar
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/masuk"
                  onClick={closeMenus}
                  className="flex-1 rounded-md border border-border px-3 py-2 text-center text-sm font-medium"
                >
                  Masuk
                </Link>
                <Link
                  href="/daftar"
                  onClick={closeMenus}
                  className="flex-1 rounded-md bg-accent px-3 py-2 text-center text-sm font-medium text-white"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
