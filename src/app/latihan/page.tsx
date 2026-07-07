import type { Metadata } from "next";
import { Camera } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PracticeArena } from "@/components/practice-arena";

export const metadata: Metadata = {
  title: "Practice Arena",
  description:
    "Latihan alfabet BISINDO dengan kamera. Semua pemrosesan berjalan di browser, tanpa video yang dikirim ke server.",
};

export default function LatihanPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader
        icon={Camera}
        title="Practice Arena"
        scope="26 huruf alfabet"
        description="Peragakan huruf di depan kamera dan dapatkan umpan balik langsung. Video tidak meninggalkan perangkatmu."
      />
      <div className="mt-6">
        <PracticeArena />
      </div>
    </div>
  );
}
