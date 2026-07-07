import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { InstitutionDashboard } from "@/components/institution-dashboard";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Dashboard institusi",
  description:
    "Pantau progres pelatihan BISINDO staf: total latihan, akurasi, dan aktivitas terakhir.",
};

export default function InstitusiPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader
        icon={BarChart3}
        title="Dashboard institusi"
        scope="Identitas per perangkat"
        description="Pantau total latihan, akurasi, dan aktivitas terakhir tiap perangkat dari log latihan."
      />
      <div className="mt-6">
        <InstitutionDashboard />
      </div>
    </div>
  );
}
