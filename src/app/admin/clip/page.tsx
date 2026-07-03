import type { Metadata } from "next";
import { ClipStudio } from "@/components/clip-studio";

export const metadata: Metadata = {
  title: "Clip Studio",
  robots: { index: false },
  description:
    "Alat admin untuk merekam ulang gerakan isyarat kata lewat webcam dan menyimpannya sebagai klip avatar.",
};

export default function ClipStudioPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Clip Studio
        </h1>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted">
          Alat admin, hanya berfungsi di mesin pengembangan
        </span>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Klip kata bawaan dihasilkan otomatis dari video dataset dan kualitasnya
        bervariasi. Di sini kamu bisa merekam ulang gerakan yang benar dengan
        kameramu sendiri: pilih kata, rekam 4 detik, tinjau hasilnya di avatar,
        lalu simpan. Pose huruf diatur terpisah di Pose Studio (/admin/pose).
      </p>
      <div className="mt-6">
        <ClipStudio />
      </div>
    </div>
  );
}
