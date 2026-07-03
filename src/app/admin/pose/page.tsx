import type { Metadata } from "next";
import { PoseEditor } from "@/components/pose-editor";

export const metadata: Metadata = {
  title: "Pose Studio",
  robots: { index: false },
  description:
    "Alat admin untuk membentuk pose isyarat avatar per huruf dan menyimpannya sebagai override.",
};

export default function PoseStudioPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Pose Studio
        </h1>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted">
          Alat admin, hanya berfungsi di mesin pengembangan
        </span>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Bentuk pose isyarat tiap huruf: lipat sendi jari satu per satu atau
        pakai preset, putar arah jari dan telapak, geser posisi tangan lewat
        slider atau drag langsung di kanvas. Simpan menulis ke
        pose_overrides.json dan meregenerasi pose sehingga langsung dipakai
        halaman belajar, kuis, penerjemah, dan roleplay.
      </p>
      <div className="mt-6">
        <PoseEditor />
      </div>
    </div>
  );
}
