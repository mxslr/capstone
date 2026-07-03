"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AvatarViewer, type LetterPose } from "@/components/avatar-viewer";
import { IconArrowRight, IconHand } from "@/components/icons";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function AlphabetLearning() {
  const [poses, setPoses] = useState<Record<string, LetterPose> | null>(null);
  const [letter, setLetter] = useState("A");
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/poses/alphabet.json?v=${Date.now()}`)
      .then((r) => r.json())
      .then(setPoses)
      .catch(() => setError(true));
  }, []);

  const pose = poses?.[letter] ?? null;
  const twoHanded =
    pose?.left && pose?.right && pose.left.usage >= 0.7 && pose.right.usage >= 0.7;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-surface sm:aspect-[16/10]">
          <AvatarViewer pose={pose} />
          <div className="absolute left-3 top-3 rounded-md bg-background/90 px-3 py-1.5">
            <span className="text-2xl font-semibold tracking-tight text-accent">
              {letter}
            </span>
          </div>
          {pose && (
            <p className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-background/90 px-2.5 py-1 text-xs text-muted">
              <IconHand width={13} height={13} className="text-accent" />
              {twoHanded ? "Isyarat dua tangan" : "Isyarat satu tangan"}
            </p>
          )}
        </div>
        {error && (
          <p className="mt-3 rounded-md border border-border bg-surface px-3 py-2 text-sm">
            Data pose gagal dimuat. Muat ulang halaman untuk mencoba lagi.
          </p>
        )}
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Peragaan avatar adalah aproksimasi dari median data landmark, detail
          seperti arah telapak dan kontak antar tangan belum sepenuhnya akurat.
        </p>
      </div>

      <div>
        <p className="text-sm font-medium">Pilih huruf</p>
        <div className="mt-3 grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-5">
          {LETTERS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLetter(l)}
              aria-pressed={letter === l}
              className={
                letter === l
                  ? "rounded-md bg-accent py-2 text-sm font-semibold text-white"
                  : "rounded-md border border-border py-2 text-sm font-medium transition-colors hover:border-accent"
              }
            >
              {l}
            </button>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-2">
          <Link
            href="/belajar/kuis"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-strong"
          >
            Mulai kuis harian
            <IconArrowRight width={16} height={16} />
          </Link>
          <Link
            href="/latihan"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-strong"
          >
            Uji lewat kamera di Practice Arena
            <IconArrowRight width={16} height={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
