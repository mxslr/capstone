import type { Metadata } from "next";
import { PracticeArena } from "@/components/practice-arena";

export const metadata: Metadata = {
  title: "Practice Arena",
  description:
    "Latihan alfabet BISINDO dengan kamera. Deteksi tangan dan pengenalan huruf berjalan sepenuhnya di browser, tanpa video yang dikirim ke server.",
};

export default function LatihanPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Practice Arena
        </h1>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted">
          Mendukung 26 huruf alfabet
        </span>
      </div>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Peragakan huruf alfabet BISINDO di depan kamera dan dapatkan umpan
        balik langsung. Model ini versi awal yang dilatih dari dataset publik
        dan belum divalidasi penuh oleh komunitas Tuli.
      </p>
      <div className="mt-6">
        <PracticeArena />
      </div>
    </div>
  );
}
