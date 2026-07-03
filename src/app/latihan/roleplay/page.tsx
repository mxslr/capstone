import type { Metadata } from "next";
import { RoleplayLoader } from "@/components/roleplay-loader";

export const metadata: Metadata = {
  title: "Roleplay apotek",
  description:
    "Latihan percakapan BISINDO dengan skenario tetap pendaftaran di apotek. Alur tanya jawab terbatas dari kosakata dasar yang tersedia.",
};

export default function RoleplayPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Roleplay: di apotek
        </h1>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted">
          Satu skenario, alur terbatas
        </span>
      </div>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Berlatih percakapan sehari-hari lewat skenario pendaftaran di apotek.
        Avatar memperagakan kata kunci dari kosakata dasar, kata lain dieja
        jari. Alurnya tetap dan deterministik, bukan percakapan bebas.
      </p>
      <div className="mt-6">
        <RoleplayLoader />
      </div>
    </div>
  );
}
