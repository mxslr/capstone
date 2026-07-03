"use client";

import { useEffect, useState } from "react";
import { DailyQuiz } from "@/components/daily-quiz";
import type { LetterPose } from "@/components/avatar-viewer";

export function QuizLoader() {
  const [poses, setPoses] = useState<Record<string, LetterPose> | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/poses/alphabet.json?v=${Date.now()}`)
      .then((r) => r.json())
      .then(setPoses)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <p className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
        Data pose gagal dimuat. Muat ulang halaman untuk mencoba lagi.
      </p>
    );
  }
  if (!poses) return <p className="text-sm text-muted">Memuat pose...</p>;
  return <DailyQuiz poses={poses} />;
}
