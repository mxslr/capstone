"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  AuthShell,
  Divider,
  Field,
  FormError,
  GoogleButton,
  SubmitButton,
  inputClass,
} from "@/components/auth/ui";
import { getSupabase } from "@/lib/supabase";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/belajar";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error") === "oauth" ? "Login Google gagal. Coba lagi." : null,
  );
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    const supabase = getSupabase();
    if (!supabase) return;
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Email atau password salah."
          : "Tidak bisa masuk. Coba lagi.",
      );
      setLoading(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <AuthShell title="Masuk" subtitle="Lanjutkan belajar BISINDO.">
      <div className="space-y-4">
        <GoogleButton onClick={signInWithGoogle} loading={loading} />
        <Divider />
        <form onSubmit={onSubmit} className="space-y-4">
          <FormError message={error} />
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="Password kamu"
            />
          </Field>
          <SubmitButton loading={loading}>Masuk</SubmitButton>
        </form>
        <div className="flex items-center justify-between text-sm">
          <Link
            href="/lupa-password"
            className="text-muted transition-colors hover:text-accent"
          >
            Lupa password?
          </Link>
          <Link href="/daftar" className="font-medium text-accent hover:text-accent-strong">
            Buat akun
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
