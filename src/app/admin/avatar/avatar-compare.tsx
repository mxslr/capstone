"use client";

import { useEffect, useState } from "react";
import { AvatarViewer, type LetterPose } from "@/components/avatar-viewer";

const MODELS = [
  { key: "current", label: "Sekarang (Amy)", url: "/models/avatar.glb" },
  { key: "michelle", label: "Michelle (lama)", url: "/models/avatar-michelle.glb" },
];

const TEST_LETTERS = ["A", "B", "L", "V"];

export function AvatarCompare() {
  const [poses, setPoses] = useState<Record<string, LetterPose> | null>(null);
  const [model, setModel] = useState(MODELS[0]);
  const [letter, setLetter] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/poses/alphabet.json?v=${Date.now()}`)
      .then((r) => r.json())
      .then(setPoses)
      .catch(() => setPoses(null));
  }, []);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {MODELS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setModel(m)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              model.key === m.key
                ? "border-accent bg-accent text-white"
                : "border-border hover:border-accent hover:text-accent"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setLetter(null)}
          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            letter === null ? "border-accent text-accent" : "border-border"
          }`}
        >
          Istirahat
        </button>
        {TEST_LETTERS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLetter(l)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              letter === l ? "border-accent text-accent" : "border-border"
            }`}
          >
            Huruf {l}
          </button>
        ))}
      </div>
      <div className="mt-4 aspect-[4/3] overflow-hidden rounded-xl border border-border bg-surface sm:aspect-[16/9]">
        <AvatarViewer
          key={model.key}
          pose={letter && poses ? (poses[letter] ?? null) : null}
          modelUrl={model.url}
        />
      </div>
    </div>
  );
}
