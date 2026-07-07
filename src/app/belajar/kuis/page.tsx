import type { Metadata } from "next";
import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { QuizLoader } from "@/components/quiz-loader";

export const metadata: Metadata = {
  title: "Kuis harian",
  description:
    "Kuis harian alfabet BISINDO dengan spaced repetition. Huruf yang sering salah muncul lebih cepat.",
};

export default function KuisPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader
        icon={CalendarClock}
        title="Kuis harian"
        scope="Alfabet, spaced repetition"
        description="Tebak huruf yang diperagakan avatar. Huruf yang sering keliru muncul lebih dulu."
      />
      <div className="mt-6">
        <QuizLoader />
      </div>
    </div>
  );
}
