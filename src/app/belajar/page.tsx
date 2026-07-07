import type { Metadata } from "next";
import { AlphabetLearning } from "@/components/alphabet-learning";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Belajar alfabet",
  description:
    "Belajar alfabet BISINDO bersama avatar 3D yang memperagakan bentuk tangan tiap huruf.",
};

export default function BelajarPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader
        title="Belajar alfabet"
        scope="26 huruf"
        description="Pilih huruf dan avatar memperagakan bentuk tangannya. Ulangi atau perlambat sesukamu."
      />
      <div className="mt-6">
        <AlphabetLearning />
      </div>
    </div>
  );
}
