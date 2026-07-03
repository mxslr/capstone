import type { Metadata } from "next";
import { InstitutionDashboard } from "@/components/institution-dashboard";

export const metadata: Metadata = {
  title: "Dashboard institusi",
  description:
    "Pantau progres pelatihan BISINDO staf: total latihan, akurasi, dan aktivitas terakhir per perangkat.",
};

export default function InstitusiPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Dashboard institusi
        </h1>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted">
          Versi awal, tanpa akun
        </span>
      </div>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Pantau progres pelatihan BISINDO staf dari log latihan. Di versi awal
        ini identitas berupa kode perangkat anonim, belum ada autentikasi dan
        manajemen anggota, jadi gunakan untuk uji coba internal dulu.
      </p>
      <div className="mt-6">
        <InstitutionDashboard />
      </div>
    </div>
  );
}
