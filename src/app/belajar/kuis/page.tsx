import type { Metadata } from "next";
import { QuizLoader } from "@/components/quiz-loader";

export const metadata: Metadata = {
  title: "Kuis harian",
  description:
    "Kuis harian alfabet BISINDO dengan spaced repetition. Huruf yang sering salah dijadwalkan muncul lebih cepat.",
};

export default function KuisPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Kuis harian
        </h1>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted">
          Alfabet, spaced repetition
        </span>
      </div>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Tebak huruf yang diperagakan avatar. Urutan soal mengikuti jadwal
        pengulanganmu, huruf yang sering keliru muncul lebih dulu.
      </p>
      <div className="mt-6">
        <QuizLoader />
      </div>
    </div>
  );
}
