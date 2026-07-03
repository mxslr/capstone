"use client";

/*
 * Player peragaan isyarat: menerima daftar token, memainkan klip kata dari
 * kosakata bila tersedia, selain itu mengeja huruf demi huruf memakai pose
 * alfabet. Semua transisi dihaluskan oleh AvatarViewer.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { LetterPose } from "@/components/avatar-viewer";
import { AvatarViewer } from "@/components/avatar-viewer";
import type { WordClip } from "@/lib/vocabulary";

const LETTER_HOLD_MS = 950;
const WORD_GAP_MS = 450;
const REST_POSE: LetterPose | null = null;

/* jeda antar kata: lengan tetap terangkat dengan jari rileks, tidak turun
 * penuh ke posisi istirahat supaya rangkaian kata mengalir natural */
const relaxedCurls = [0.35, 0.3, 0.2];
const GAP_POSE: LetterPose = {
  left: null,
  right: {
    thumb: relaxedCurls,
    index: relaxedCurls,
    middle: relaxedCurls,
    ring: relaxedCurls,
    pinky: relaxedCurls,
    usage: 1,
  },
  samples: 0,
};

export type PlayItem =
  | { kind: "word"; word: string; clip: WordClip }
  | { kind: "spell"; word: string };

export type PlayerStatus = {
  playing: boolean;
  currentWord: string | null;
  currentLetter: string | null;
  mode: "word" | "spell" | null;
};

export function useSignPlayer(
  alphabet: Record<string, LetterPose> | null,
) {
  const [pose, setPose] = useState<LetterPose | null>(REST_POSE);
  const [status, setStatus] = useState<PlayerStatus>({
    playing: false,
    currentWord: null,
    currentLetter: null,
    mode: null,
  });
  const [speed, setSpeed] = useState(1);
  const speedRef = useRef(1);
  const cancelRef = useRef(0);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const stop = useCallback(() => {
    cancelRef.current++;
    setPose(REST_POSE);
    setStatus({ playing: false, currentWord: null, currentLetter: null, mode: null });
  }, []);

  const play = useCallback(
    async (items: PlayItem[]) => {
      const token = ++cancelRef.current;
      const wait = (ms: number) =>
        new Promise((r) => setTimeout(r, ms / speedRef.current));
      const alive = () => cancelRef.current === token;

      for (const item of items) {
        if (!alive()) return;
        if (item.kind === "spell") {
          for (const ch of item.word.toUpperCase()) {
            if (!alive()) return;
            const p = alphabet?.[ch] ?? null;
            setStatus({
              playing: true,
              currentWord: item.word,
              currentLetter: ch,
              mode: "spell",
            });
            setPose(p);
            await wait(LETTER_HOLD_MS);
          }
        } else {
          setStatus({
            playing: true,
            currentWord: item.word,
            currentLetter: null,
            mode: "word",
          });
          const { frames, fps, twoHanded } = item.clip;
          const frameMs = 1000 / fps;
          for (const f of frames) {
            if (!alive()) return;
            setPose(clipFrameToPose(f, twoHanded));
            await wait(frameMs);
          }
        }
        if (!alive()) return;
        setPose(GAP_POSE);
        await wait(WORD_GAP_MS);
      }
      if (alive()) {
        setStatus({ playing: false, currentWord: null, currentLetter: null, mode: null });
        setPose(REST_POSE);
      }
    },
    [alphabet],
  );

  return { pose, status, play, stop, speed, setSpeed };
}

/* Konversi satu frame klip menjadi pose avatar, dipakai player dan
 * pratinjau statis Clip Studio. */
export function clipFrameToPose(
  f: import("@/lib/vocabulary").ClipFrame,
  twoHanded: boolean,
): LetterPose {
  return {
    left: f.left ? curlsToHand(f.left) : null,
    right: f.right ? curlsToHand(f.right) : null,
    samples: 0,
    forceTwoHanded: twoHanded,
    leftWrist: f.leftWrist ?? null,
    rightWrist: f.rightWrist ?? null,
    instant: true,
  };
}

function curlsToHand(curls: number[]) {
  return {
    thumb: curls.slice(0, 3),
    index: curls.slice(3, 6),
    middle: curls.slice(6, 9),
    ring: curls.slice(9, 12),
    pinky: curls.slice(12, 15),
    usage: 1,
  };
}

export function SignStage({
  pose,
  status,
  transitionSpeed,
}: {
  pose: LetterPose | null;
  status: PlayerStatus;
  transitionSpeed?: number;
}) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-surface sm:aspect-[16/10]">
      <AvatarViewer pose={pose} transitionSpeed={transitionSpeed} />
      {status.playing && status.currentWord && (
        <div className="absolute left-3 top-3 rounded-md bg-background/90 px-3 py-1.5 text-sm">
          <span className="font-semibold">{status.currentWord}</span>
          {status.mode === "spell" && status.currentLetter && (
            <span className="ml-2 text-muted">
              ejaan jari: <span className="font-semibold text-accent">{status.currentLetter}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
