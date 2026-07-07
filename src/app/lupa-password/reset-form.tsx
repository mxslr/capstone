"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AuthShell,
  Field,
  FormError,
  FormNotice,
  SubmitButton,
  inputClass,
} from "@/components/auth/ui";
import { getSupabase } from "@/lib/supabase";

type Step = "email" | "otp" | "password";

export function ResetForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      setError("Tidak bisa mengirim kode. Periksa email lalu coba lagi.");
      return;
    }
    setNotice(`Kode 6 digit dikirim ke ${email}.`);
    setStep("otp");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: token.trim(),
      type: "recovery",
    });
    setLoading(false);
    if (error) {
      setError("Kode salah atau sudah kedaluwarsa. Coba lagi.");
      return;
    }
    setNotice(null);
    setStep("password");
  }

  async function saveNewPassword(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError("Password baru tidak bisa disimpan. Coba lagi.");
      return;
    }
    router.push("/belajar");
    router.refresh();
  }

  return (
    <AuthShell
      title="Atur ulang password"
      subtitle={
        step === "email"
          ? "Kami kirim kode 6 digit ke email kamu."
          : step === "otp"
            ? "Masukkan kode dari email."
            : "Buat password baru."
      }
    >
      <div className="space-y-4">
        <FormError message={error} />
        <FormNotice message={notice} />

        {step === "email" && (
          <form onSubmit={sendCode} className="space-y-4">
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
            <SubmitButton loading={loading}>Kirim kode</SubmitButton>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={verifyCode} className="space-y-4">
            <Field label="Kode OTP">
              <input
                type="text"
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className={`${inputClass} text-center text-lg tracking-[0.5em]`}
                placeholder="000000"
              />
            </Field>
            <SubmitButton loading={loading}>Verifikasi</SubmitButton>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full text-sm text-muted transition-colors hover:text-accent"
            >
              Kirim ulang kode
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={saveNewPassword} className="space-y-4">
            <Field label="Password baru">
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
            <SubmitButton loading={loading}>Simpan password</SubmitButton>
          </form>
        )}

        <p className="text-sm text-muted">
          Ingat passwordmu?{" "}
          <Link href="/masuk" className="font-medium text-accent hover:text-accent-strong">
            Masuk
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
