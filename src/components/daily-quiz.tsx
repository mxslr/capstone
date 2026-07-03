"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AvatarViewer, type LetterPose } from "@/components/avatar-viewer";
import { IconArrowRight, IconCheck, IconRepeat } from "@/components/icons";
import {
  getOrInitState,
  loadProgress,
  recordReview,
} from "@/lib/progress";
import { sessionQueue } from "@/lib/srs";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const QUIZ_LENGTH = 10;
const CHOICES = 4;

type Question = {
  answer: string;
  options: string[];
};

function buildQuestions(): Question[] {
  const now = Date.now();
  const progress = loadProgress();
  const states = LETTERS.map((l) => getOrInitState(progress, l, now));
  // antrean SRS: jatuh tempo paling awal dulu, itemnya yang paling butuh diulang
  const ordered = sessionQueue(states).slice(0, QUIZ_LENGTH);
  return ordered.map((s) => {
    const distractors = LETTERS.filter((l) => l !== s.itemId)
      .sort(() => Math.random() - 0.5)
      .slice(0, CHOICES - 1);
    const options = [...distractors, s.itemId].sort(() => Math.random() - 0.5);
    return { answer: s.itemId, options };
  });
}

export function DailyQuiz({
  poses,
}: {
  poses: Record<string, LetterPose>;
}) {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [wrongLetters, setWrongLetters] = useState<string[]>([]);
  const shownAt = useRef(Date.now());

  useEffect(() => {
    setQuestions(buildQuestions());
  }, []);

  const q = questions?.[index] ?? null;
  const done = questions !== null && index >= questions.length;
  const pose = useMemo(
    () => (q ? (poses[q.answer] ?? null) : null),
    [q, poses],
  );

  useEffect(() => {
    shownAt.current = Date.now();
  }, [index]);

  if (!questions) {
    return <p className="text-sm text-muted">Menyiapkan kuis...</p>;
  }

  if (done) {
    return (
      <div className="rounded-lg border border-border p-6">
        <IconCheck className="text-accent" width={24} height={24} />
        <h2 className="mt-3 text-lg font-semibold tracking-tight">
          Kuis selesai, {score} dari {questions.length} benar
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {wrongLetters.length > 0
            ? `Huruf ${[...new Set(wrongLetters)].join(", ")} dijadwalkan muncul lagi lebih cepat di kuis berikutnya.`
            : "Semua benar. Interval pengulangan huruf-huruf ini diperpanjang."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setQuestions(buildQuestions());
              setIndex(0);
              setScore(0);
              setWrongLetters([]);
              setPicked(null);
            }}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
          >
            <IconRepeat width={15} height={15} />
            Ulangi kuis
          </button>
          <Link
            href="/belajar"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface"
          >
            Kembali belajar
          </Link>
        </div>
      </div>
    );
  }

  const answerAndNext = (choice: string) => {
    if (picked !== null || !q) return;
    setPicked(choice);
    const correct = choice === q.answer;
    const elapsed = Date.now() - shownAt.current;
    const quality = correct ? (elapsed < 5000 ? 5 : 4) : 2;
    void recordReview(q.answer, quality, "quiz", elapsed);
    if (correct) setScore((s) => s + 1);
    else setWrongLetters((w) => [...w, q.answer]);
    setTimeout(() => {
      setPicked(null);
      setIndex((i) => i + 1);
    }, 900);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-surface sm:aspect-[16/10]">
        <AvatarViewer pose={pose} />
        <p className="absolute left-3 top-3 rounded-md bg-background/90 px-2.5 py-1 text-xs text-muted">
          Soal {index + 1} dari {questions.length}
        </p>
      </div>
      <div>
        <p className="text-sm font-medium">Huruf apa yang diperagakan?</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {q!.options.map((opt) => {
            let cls =
              "rounded-md border border-border py-3 text-lg font-semibold transition-colors hover:border-accent";
            if (picked !== null) {
              if (opt === q!.answer) {
                cls = "rounded-md bg-accent py-3 text-lg font-semibold text-white";
              } else if (opt === picked) {
                cls =
                  "rounded-md border border-border bg-surface py-3 text-lg font-semibold text-muted line-through";
              } else {
                cls =
                  "rounded-md border border-border py-3 text-lg font-semibold text-muted";
              }
            }
            return (
              <button
                key={opt}
                type="button"
                disabled={picked !== null}
                onClick={() => answerAndNext(opt)}
                className={cls}
              >
                {opt}
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          Jawaban salah membuat huruf itu kembali lebih cepat, jawaban benar
          memperpanjang jedanya. Skor: {score}
        </p>
        <Link
          href="/latihan"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-strong"
        >
          Latihan dengan kamera
          <IconArrowRight width={16} height={16} />
        </Link>
      </div>
    </div>
  );
}
