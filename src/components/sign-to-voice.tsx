"use client";

/*
 * Isyarat ke suara, dua mode yang dipilih eksplisit supaya model tidak
 * saling bertabrakan:
 * - Kata: model sekuens WL-BISINDO mengenali isyarat kata bergerak.
 * - Eja abjad: model alfabet menyusun huruf per huruf menjadi kata.
 * Semua inferensi on-device, hasil dibacakan lewat speechSynthesis.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { IconCamera, IconShield } from "@/components/icons";
import {
  FEATURE_SIZE,
  featuresFromResult,
  pickHands,
} from "@/lib/hand-features";
import type { WordClip } from "@/lib/vocabulary";
import {
  WORD_FEATURE_SIZE,
  WORD_WINDOW,
  wordFrameFeatures,
  wordFrameFeaturesV2,
} from "@/lib/word-features";

type Phase = "consent" | "loading" | "ready" | "error";
type Mode = "kata" | "eja";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const PREDICT_EVERY_MS = 600;
/* model kata dilatih pada 15 fps; buffer harus diisi pada laju yang sama
 * supaya jendela 48 frame benar-benar mencakup ~3 detik gerakan */
const WORD_CAPTURE_FPS = 15;
const MIN_WORD_CONFIDENCE = 0.75;
const MIN_LETTER_CONFIDENCE = 0.7;
const REPEAT_COOLDOWN_MS = 2500;
const LETTER_STABLE_FRAMES = 10;
const LETTER_COMMIT_COOLDOWN_MS = 1100;

export function SignToVoice({ clips }: { clips: Record<string, WordClip> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const modeRef = useRef<Mode>("kata");

  const [phase, setPhase] = useState<Phase>("consent");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("kata");
  const [wordModelReady, setWordModelReady] = useState(true);
  const [recognized, setRecognized] = useState<
    { word: string; confidence: number; at: number }[]
  >([]);
  const [live, setLive] = useState<string | null>(null);
  const [spelled, setSpelled] = useState("");
  const spelledRef = useRef("");
  const [speak, setSpeak] = useState(true);
  const speakRef = useRef(true);

  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);
  useEffect(() => {
    modeRef.current = mode;
    setLive(null);
  }, [mode]);

  const say = (text: string) => {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "id-ID";
      speechSynthesis.speak(u);
    }
  };

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setPhase("consent");
    setLive(null);
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    setPhase("loading");
    setError("");
    try {
      const [{ FilesetResolver, HandLandmarker, DrawingUtils }, tf] =
        await Promise.all([
          import("@mediapipe/tasks-vision"),
          import("@tensorflow/tfjs"),
        ]);

      const [vision, letterModel, letterMeta] = await Promise.all([
        FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm",
        ),
        tf.loadLayersModel(`/models/bisindo-alphabet/model.json?v=${Date.now()}`),
        fetch(`/models/bisindo-alphabet/metadata.json?v=${Date.now()}`).then((r) => r.json()),
      ]);
      const twoHandedLetters = new Set<string>(letterMeta.twoHanded ?? []);

      // model kata opsional; tanpa itu mode eja tetap bisa dipakai
      let wordModel: import("@tensorflow/tfjs").LayersModel | null = null;
      let words: string[] = [];
      let useDeltas = false;
      let featSize = WORD_FEATURE_SIZE;
      let baseSize = WORD_FEATURE_SIZE;
      let usePose = false;
      let poseLandmarker: import("@mediapipe/tasks-vision").PoseLandmarker | null =
        null;
      // cache-bust supaya pergantian model langsung terbaca tanpa cache lama
      const bust = Date.now();
      const head = await fetch(`/models/bisindo-words/model.json?v=${bust}`, {
        method: "HEAD",
      });
      if (head.ok) {
        const meta = await fetch(
          `/models/bisindo-words/metadata.json?v=${bust}`,
        ).then((r) => r.json());
        wordModel = await tf.loadLayersModel(
          `/models/bisindo-words/model.json?v=${bust}`,
        );
        words = meta.words;
        useDeltas = !!meta.deltas;
        featSize = meta.featureSize ?? WORD_FEATURE_SIZE;
        baseSize = useDeltas ? featSize / 2 : featSize;
        usePose = !!meta.pose;
        if (usePose) {
          const { PoseLandmarker } = await import("@mediapipe/tasks-vision");
          poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
          });
        }
        tf.tidy(() => wordModel!.predict(tf.zeros([1, WORD_WINDOW, featSize])));
      } else {
        setWordModelReady(false);
        setMode("eja");
      }
      tf.tidy(() => letterModel.predict(tf.zeros([1, FEATURE_SIZE])));

      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
          delegate: "GPU",
        },
        numHands: 2,
        runningMode: "VIDEO",
        minHandDetectionConfidence: 0.4,
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setPhase("ready");

      const buffer: Float32Array[] = [];
      const recentLetters: string[] = [];
      let lastVideoTime = -1;
      let lastPredict = 0;
      let lastBufferPush = 0;
      let lastSpoken = "";
      let lastSpokenAt = 0;
      let lastCommitAt = 0;
      let lastCommitLetter = "";
      let handGone = true;
      let lastPoseLm: { x: number; y: number }[] | null = null;

      const loop = () => {
        rafRef.current = requestAnimationFrame(loop);
        const v = videoRef.current;
        const c = canvasRef.current;
        if (!v || !c || v.currentTime === lastVideoTime) return;
        lastVideoTime = v.currentTime;

        const now = performance.now();
        const result = landmarker.detectForVideo(v, now);

        c.width = v.videoWidth;
        c.height = v.videoHeight;
        const ctx = c.getContext("2d")!;
        ctx.clearRect(0, 0, c.width, c.height);
        const du = new DrawingUtils(ctx);
        const picked = pickHands(result);
        const handsDetected = (picked.left ? 1 : 0) + (picked.right ? 1 : 0);
        for (const lms of [picked.left, picked.right]) {
          if (!lms) continue;
          du.drawConnectors(lms, HandLandmarker.HAND_CONNECTIONS, {
            color: "#0f766e",
            lineWidth: 2,
          });
        }

        // gambar kerangka lengan sebagai bukti pose terbaca
        const drawArms = (lm: { x: number; y: number }[] | null) => {
          if (!lm || modeRef.current !== "kata") return;
          const px = (p: { x: number; y: number }) =>
            [p.x * c.width, p.y * c.height] as const;
          ctx.strokeStyle = "#b45309";
          ctx.lineWidth = 3;
          for (const [a, b] of [
            [11, 12],
            [11, 13],
            [13, 15],
            [12, 14],
            [14, 16],
          ]) {
            const [x1, y1] = px(lm[a]);
            const [x2, y2] = px(lm[b]);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
          ctx.fillStyle = "#b45309";
          for (const i of [11, 12, 13, 14, 15, 16]) {
            const [x, y] = px(lm[i]);
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        };

        if (modeRef.current === "kata") {
          if (!wordModel) return;
          drawArms(lastPoseLm);
          if (now - lastBufferPush < 1000 / WORD_CAPTURE_FPS) return;
          lastBufferPush = now;
          if (usePose && poseLandmarker) {
            const poseRes = poseLandmarker.detectForVideo(v, now + 0.001);
            const lm = poseRes.landmarks?.[0] ?? null;
            if (lm) lastPoseLm = lm;
            buffer.push(wordFrameFeaturesV2(result, lastPoseLm));
          } else {
            buffer.push(wordFrameFeatures(result));
          }
          if (buffer.length > WORD_WINDOW) buffer.shift();
          if (
            buffer.length === WORD_WINDOW &&
            now - lastPredict > PREDICT_EVERY_MS
          ) {
            lastPredict = now;
            const anyHand = buffer.some((f) => f[30] > 0 || f[31] > 0);
            if (!anyHand) {
              setLive(null);
              return;
            }
            const flat = new Float32Array(WORD_WINDOW * featSize);
            buffer.forEach((f, i) => {
              flat.set(f, i * featSize);
              if (useDeltas) {
                const prev = buffer[Math.max(0, i - 1)];
                for (let d = 0; d < baseSize; d++) {
                  flat[i * featSize + baseSize + d] = f[d] - prev[d];
                }
              }
            });
            const scores = tf.tidy(() => {
              const out = wordModel!.predict(
                tf.tensor3d(flat, [1, WORD_WINDOW, featSize]),
              ) as import("@tensorflow/tfjs").Tensor;
              return out.dataSync();
            });
            let best = 0;
            for (let i = 1; i < scores.length; i++) {
              if (scores[i] > scores[best]) best = i;
            }
            const w = words[best];
            const conf = scores[best];
            setLive(
              conf >= MIN_WORD_CONFIDENCE
                ? `${w} (${Math.round(conf * 100)}%)`
                : null,
            );
            const cooled =
              w !== lastSpoken || now - lastSpokenAt > REPEAT_COOLDOWN_MS;
            if (conf >= MIN_WORD_CONFIDENCE && cooled) {
              lastSpoken = w;
              lastSpokenAt = now;
              setRecognized((r) => [
                { word: w, confidence: conf, at: Date.now() },
                ...r.slice(0, 7),
              ]);
              if (speakRef.current) say(w);
            }
          }
          return;
        }

        // mode eja abjad
        const feat = featuresFromResult(result);
        if (!feat) {
          recentLetters.length = 0;
          handGone = true;
          setLive(null);
          return;
        }
        const scores = tf.tidy(() => {
          const out = letterModel.predict(
            tf.tensor2d(feat, [1, FEATURE_SIZE]),
          ) as import("@tensorflow/tfjs").Tensor;
          return out.dataSync();
        });
        let best = 0;
        for (let i = 1; i < scores.length; i++) {
          if (scores[i] > scores[best]) best = i;
        }
        const letter = LETTERS[best];
        const conf = scores[best];
        const twoOk =
          !twoHandedLetters.has(letter) || handsDetected === 2;
        recentLetters.push(
          conf >= MIN_LETTER_CONFIDENCE && twoOk ? letter : "",
        );
        if (recentLetters.length > LETTER_STABLE_FRAMES) recentLetters.shift();
        const counts = new Map<string, number>();
        for (const l of recentLetters) counts.set(l, (counts.get(l) ?? 0) + 1);
        const [top, votes] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
        const stable =
          top !== "" &&
          votes >= Math.ceil(LETTER_STABLE_FRAMES * 0.7) &&
          recentLetters.length === LETTER_STABLE_FRAMES;
        setLive(stable ? top : conf >= MIN_LETTER_CONFIDENCE ? letter : null);

        if (stable) {
          const cooled = now - lastCommitAt > LETTER_COMMIT_COOLDOWN_MS;
          const repeatable = top !== lastCommitLetter || handGone;
          if (cooled && repeatable) {
            lastCommitAt = now;
            lastCommitLetter = top;
            handGone = false;
            spelledRef.current += top;
            setSpelled(spelledRef.current);
            recentLetters.length = 0;
          }
        }
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      console.error(e);
      setError(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Izin kamera ditolak. Beri izin kamera di browser lalu coba lagi."
          : "Gagal memuat model atau kamera. Periksa koneksi lalu coba lagi.",
      );
      setPhase("error");
    }
  }, []);

  if (phase === "consent" || phase === "error") {
    return (
      <div className="rounded-lg border border-border p-6 sm:p-8">
        <IconShield className="text-accent" width={24} height={24} />
        <h2 className="mt-3 text-lg font-semibold tracking-tight">
          Sebelum kamera menyala
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
          <li>
            Deteksi tangan dan pengenalan berjalan di perangkat ini, tidak ada
            video yang dikirim ke server.
          </li>
          <li>
            Mode Kata mengenali {Object.keys(clips).length} isyarat kata,
            mode Eja abjad menyusun 26 huruf menjadi kata. Kamu memilih
            modenya, keduanya tidak berjalan bersamaan.
          </li>
        </ul>
        {phase === "error" && (
          <p className="mt-4 rounded-md border border-border bg-surface px-3 py-2 text-sm">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={start}
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
        >
          <IconCamera width={16} height={16} />
          Saya setuju, aktifkan kamera
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="relative overflow-hidden rounded-lg border border-border bg-surface">
        <video ref={videoRef} playsInline muted className="w-full -scale-x-100" />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full -scale-x-100"
        />
        {phase === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <p className="text-sm text-muted">Memuat model dan kamera...</p>
          </div>
        )}
        {phase === "ready" && live && (
          <div className="absolute left-3 top-3 rounded-md bg-background/90 px-3 py-1.5 text-sm font-semibold">
            {live}
          </div>
        )}
      </div>

      <div>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {(
            [
              ["kata", "Kata"],
              ["eja", "Eja abjad"],
            ] as [Mode, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              disabled={value === "kata" && !wordModelReady}
              onClick={() => setMode(value)}
              className={
                mode === value
                  ? "flex-1 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white"
                  : "flex-1 rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground disabled:opacity-40"
              }
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "kata" ? (
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Dikenali</p>
              <label className="flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={speak}
                  onChange={(e) => setSpeak(e.target.checked)}
                  className="accent-[var(--accent)]"
                />
                Bacakan
              </label>
            </div>
            <ul className="mt-2 space-y-1.5">
              {recognized.length === 0 && (
                <li className="text-sm text-muted">
                  Peragakan salah satu isyarat kata di depan kamera.
                </li>
              )}
              {recognized.map((r) => (
                <li
                  key={r.at}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-sm"
                >
                  <span className="font-medium">{r.word}</span>
                  <span className="text-xs text-muted">
                    {Math.round(r.confidence * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm font-medium">Ejaan tersusun</p>
            <div className="mt-2 min-h-[52px] rounded-md border border-border bg-surface px-3 py-2 text-lg font-semibold tracking-wide">
              {spelled || (
                <span className="text-sm font-normal text-muted">
                  Tahan tiap huruf sampai stabil, huruf akan tersusun di sini.
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (spelledRef.current) say(spelledRef.current.toLowerCase());
                }}
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
              >
                Bacakan
              </button>
              <button
                type="button"
                onClick={() => {
                  spelledRef.current = spelledRef.current.slice(0, -1);
                  setSpelled(spelledRef.current);
                }}
                className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-surface"
              >
                Hapus huruf
              </button>
              <button
                type="button"
                onClick={() => {
                  spelledRef.current = "";
                  setSpelled("");
                }}
                className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-surface"
              >
                Bersihkan
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Huruf yang sama dua kali berturut-turut perlu tanganmu keluar
              frame sebentar di antaranya.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={stop}
          className="mt-4 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface"
        >
          Hentikan kamera
        </button>
      </div>
    </div>
  );
}
