import type { Metadata } from "next";
import { MessagesSquare } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RoleplayLoader } from "@/components/roleplay-loader";

export const metadata: Metadata = {
  title: "Roleplay apotek",
  description:
    "Latihan percakapan BISINDO lewat skenario pendaftaran di apotek dengan kosakata dasar.",
};

export default function RoleplayPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader
        icon={MessagesSquare}
        title="Roleplay: di apotek"
        scope="Skenario percakapan terarah"
        description="Berlatih percakapan pendaftaran di apotek. Kata kunci diperagakan avatar, kata lain dieja jari."
      />
      <div className="mt-6">
        <RoleplayLoader />
      </div>
    </div>
  );
}
