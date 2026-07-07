"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AuthShell,
  Divider,
  Field,
  FormError,
  FormNotice,
  GoogleButton,
  SubmitButton,
  inputClass,
} from "@/components/auth/ui";
import { getSupabase } from "@/lib/supabase";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    const supabase = getSupabase();
    if (!supabase) return;
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=/belajar` },
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${location.origin}/auth/callback?next=/belajar`,
      },
    });
    setLoading(false);
    if (error) {
      setError(
        error.message.includes("already registered")
          ? "Email ini sudah terdaftar. Silakan masuk."
          : "Pendaftaran gagal. Coba lagi.",
      );
      return;
    }
    if (data.session) {
      router.push("/belajar");
      router.refresh();
      return;
    }
    setNotice("Cek email kamu untuk tautan konfirmasi, lalu masuk.");
  }

  return (
    <AuthShell title="Buat akun" subtitle="Gratis, langsung dari browser.">
      <div className="space-y-4">
        <GoogleButton onClick={signInWithGoogle} loading={loading} />
        <Divider />
        <form onSubmit={onSubmit} className="space-y-4">
          <FormError message={error} />
          <FormNotice message={notice} />
          <Field label="Nama">
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Nama kamu"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="nama@email.com"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="Minimal 8 karakter"
            />
          </Field>
          <SubmitButton loading={loading}>Daftar</SubmitButton>
        </form>
        <p className="text-sm text-muted">
          Sudah punya akun?{" "}
          <Link href="/masuk" className="font-medium text-accent hover:text-accent-strong">
            Masuk
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
