import type { Metadata } from "next";
import { AlphabetLearning } from "@/components/alphabet-learning";

export const metadata: Metadata = {
  title: "Belajar alfabet",
  description:
    "Belajar alfabet BISINDO bersama avatar 3D. Pose tiap huruf dihitung dari dataset publik BISINDO dan masih berupa aproksimasi versi awal.",
};

export default function BelajarPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Belajar alfabet
        </h1>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted">
          26 huruf, peragaan aproksimasi dari data
        </span>
      </div>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Pilih huruf dan avatar akan memperagakan bentuk tangannya. Pose
        dihitung dari median data landmark dataset publik BISINDO, jadi anggap
        ini panduan awal, bukan pengganti belajar dari penutur BISINDO
        langsung.
      </p>
      <div className="mt-6">
        <AlphabetLearning />
      </div>
    </div>
  );
}
