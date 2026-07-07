import type { Metadata } from "next";
import { MessageSquareText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { TranslatorLoader } from "@/components/translator-loader";

export const metadata: Metadata = {
  title: "Penerjemah",
  description:
    "Penerjemah dua arah BISINDO. Suara atau teks menjadi peragaan avatar, isyarat menjadi suara.",
};

export default function TerjemahPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader
        icon={MessageSquareText}
        title="Penerjemah"
        scope="32 kosakata dasar plus ejaan jari"
        description="Ucapkan atau ketik sesuatu untuk diperagakan avatar, atau arahkan kamera untuk mengubah isyarat menjadi suara."
      />
      <div className="mt-6">
        <TranslatorLoader />
      </div>
    </div>
  );
}
