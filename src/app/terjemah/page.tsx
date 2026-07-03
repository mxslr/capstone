import type { Metadata } from "next";
import { TranslatorLoader } from "@/components/translator-loader";

export const metadata: Metadata = {
  title: "Penerjemah",
  description:
    "Penerjemah dua arah BISINDO untuk kosakata dasar. Suara atau teks menjadi peragaan avatar, isyarat menjadi suara. Kata di luar kosakata dieja huruf demi huruf.",
};

export default function TerjemahPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Penerjemah
        </h1>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted">
          Kosakata dasar, bukan kalimat bebas
        </span>
      </div>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Ucapkan atau ketik sesuatu, avatar memperagakan kata yang ada di
        kosakata dan mengeja sisanya huruf demi huruf. Arah sebaliknya
        menerjemahkan isyarat yang dikenali kamera menjadi suara.
      </p>
      <div className="mt-6">
        <TranslatorLoader />
      </div>
    </div>
  );
}
