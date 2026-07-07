"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User } from "lucide-react";
import type { User as AuthUser } from "@supabase/supabase-js";
import {
  Field,
  FormError,
  FormNotice,
  inputClass,
} from "@/components/auth/ui";
import { getSupabase } from "@/lib/supabase";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border p-6">
      <h2 className="text-base font-medium">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AccountSettings() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setName((data.user?.user_metadata?.full_name as string | undefined) ?? "");
    });
  }, []);

  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ??
    (user?.user_metadata?.picture as string | undefined) ??
    null;
  const isGoogle = user?.app_metadata?.providers?.includes("google") ?? false;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setSaving(true);
    setProfileErr(null);
    setProfileMsg(null);
    const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
    setSaving(false);
    if (error) {
      setProfileErr("Profil tidak bisa disimpan. Coba lagi.");
      return;
    }
    setProfileMsg("Profil disimpan.");
    router.refresh();
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    if (password.length < 8) {
      setPasswordErr("Password minimal 8 karakter.");
      return;
    }
    setSaving(true);
    setPasswordErr(null);
    setPasswordMsg(null);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setPasswordErr("Password tidak bisa diubah. Coba lagi.");
      return;
    }
    setPassword("");
    setPasswordMsg("Password diperbarui.");
  }

  async function signOut() {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <p className="text-sm text-muted">Memuat akun...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        Pengaturan akun
      </h1>

      <div className="mt-8 space-y-5">
        <Section title="Profil">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Foto profil"
                width={56}
                height={56}
                className="rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                <User size={30} aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{name || user.email}</p>
              <p className="truncate text-sm text-muted">{user.email}</p>
            </div>
          </div>
          <form onSubmit={saveProfile} className="mt-5 space-y-4">
            <FormError message={profileErr} />
            <FormNotice message={profileMsg} />
            <Field label="Nama">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Nama kamu"
              />
            </Field>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
            >
              Simpan profil
            </button>
          </form>
        </Section>

        <Section title="Password">
          <form onSubmit={savePassword} className="space-y-4">
            <FormError message={passwordErr} />
            <FormNotice message={passwordMsg} />
            <Field label={isGoogle ? "Password baru (opsional untuk akun Google)" : "Password baru"}>
              <input
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Minimal 8 karakter"
              />
            </Field>
            <button
              type="submit"
              disabled={saving || !password}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
            >
              Ubah password
            </button>
          </form>
        </Section>

        <Section title="Sesi">
          <p className="text-sm text-muted">Keluar dari akun di perangkat ini.</p>
          <button
            type="button"
            onClick={signOut}
            className="mt-4 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            Keluar
          </button>
        </Section>
      </div>
    </div>
  );
}
