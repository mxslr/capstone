"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconCamera, IconCheck, IconShield } from "@/components/icons";
import {
  FEATURE_SIZE,
  featuresFromResult,
  pickHands,
} from "@/lib/hand-features";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const HOLD_FRAMES = 8;
const MIN_CONFIDENCE = 0.7;
/* mayoritas dari beberapa frame terakhir supaya prediksi tidak berkedip */
const SMOOTH_WINDOW = 5;

type Phase = "consent" | "loading" | "ready" | "error";

type Stats = {
  detectMs: number;
  inferMs: number;
  fps: number;
};

export function PracticeArena() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const holdRef = useRef(0);
  const targetRef = useRef(LETTERS[0]);

  const [phase, setPhase] = useState<Phase>("consent");
  const [error, setError] = useState<string>("");
  const [prediction, setPrediction] = useState<{
    letter: string;
    confidence: number;
  } | null>(null);
  const [target, setTarget] = useState(() => LETTERS[0]);
  const [correctCount, setCorrectCount] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [needTwoHands, setNeedTwoHands] = useState(false);
  const twoHandedRef = useRef<Set<string>>(new Set());

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setPhase("consent");
    setPrediction(null);
    setStats(null);
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

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm",
      );
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
      const [model, meta] = await Promise.all([
        tf.loadLayersModel(`/models/bisindo-alphabet/model.json?v=${Date.now()}`),
        fetch(`/models/bisindo-alphabet/metadata.json?v=${Date.now()}`).then((r) => r.json()),
      ]);
      twoHandedRef.current = new Set<string>(meta.twoHanded ?? []);
      // pemanasan agar pengukuran latensi tidak memasukkan kompilasi shader
      tf.tidy(() => model.predict(tf.zeros([1, FEATURE_SIZE])));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      setPhase("ready");

      const detectTimes: number[] = [];
      const inferTimes: number[] = [];
      const recent: string[] = [];
      let lastVideoTime = -1;
      let lastStatsUpdate = 0;
      let frames = 0;

      const loop = () => {
        rafRef.current = requestAnimationFrame(loop);
        const v = videoRef.current;
        const c = canvasRef.current;
        if (!v || !c || v.currentTime === lastVideoTime) return;
        lastVideoTime = v.currentTime;
        frames++;

        const t0 = performance.now();
        const result = landmarker.detectForVideo(v, t0);
        const t1 = performance.now();

        // gambar overlay landmark
        c.width = v.videoWidth;
        c.height = v.videoHeight;
        const ctx = c.getContext("2d")!;
        ctx.clearRect(0, 0, c.width, c.height);
        // gambar hanya tangan yang lolos dedup, supaya deteksi ganda pada
        // tangan yang sama tidak tampak sebagai titik bertumpuk
        const du = new DrawingUtils(ctx);
        const picked = pickHands(result);
        const handsDetected = (picked.left ? 1 : 0) + (picked.right ? 1 : 0);
        for (const lms of [picked.left, picked.right]) {
          if (!lms) continue;
          du.drawConnectors(lms, HandLandmarker.HAND_CONNECTIONS, {
            color: "#0f766e",
            lineWidth: 2,
          });
          du.drawLandmarks(lms, { color: "#0f766e", radius: 2.5 });
        }

        // huruf dua tangan tidak dinilai sebelum kedua tangan terlihat
        const targetTwoHanded = twoHandedRef.current.has(targetRef.current);
        setNeedTwoHands(targetTwoHanded && handsDetected === 1);

        const feat = featuresFromResult(result);
        let t2 = performance.now();
        if (feat) {
          const scores = tf.tidy(() => {
            const out = model.predict(
              tf.tensor2d(feat, [1, FEATURE_SIZE]),
            ) as import("@tensorflow/tfjs").Tensor;
            return out.dataSync();
          });
          t2 = performance.now();
          let best = 0;
          for (let i = 1; i < scores.length; i++) {
            if (scores[i] > scores[best]) best = i;
          }
          const letter = LETTERS[best];
          const confidence = scores[best];

          // haluskan dengan suara mayoritas beberapa frame terakhir
          recent.push(confidence >= MIN_CONFIDENCE ? letter : "");
          if (recent.length > SMOOTH_WINDOW) recent.shift();
          const counts = new Map<string, number>();
          for (const l of recent) counts.set(l, (counts.get(l) ?? 0) + 1);
          const [smoothLetter, votes] = [...counts.entries()].sort(
            (a, b) => b[1] - a[1],
          )[0];
          const stable =
            smoothLetter !== "" && votes > SMOOTH_WINDOW / 2;

          // prediksi huruf dua tangan dari satu tangan tidak dihitung
          const predTwoHanded =
            stable && twoHandedRef.current.has(smoothLetter);
          const acceptable = stable && (!predTwoHanded || handsDetected === 2);

          setPrediction(
            acceptable ? { letter: smoothLetter, confidence } : null,
          );

          if (acceptable && smoothLetter === targetRef.current) {
            holdRef.current++;
            if (holdRef.current >= HOLD_FRAMES) {
              holdRef.current = 0;
              setCorrectCount((n) => n + 1);
              setTarget((prev) => {
                const next =
                  LETTERS[(LETTERS.indexOf(prev) + 1) % LETTERS.length];
                targetRef.current = next;
                return next;
              });
            }
          } else {
            holdRef.current = 0;
          }
        } else {
          recent.length = 0;
          setPrediction(null);
          holdRef.current = 0;
        }

        detectTimes.push(t1 - t0);
        inferTimes.push(t2 - t1);
        if (detectTimes.length > 60) detectTimes.shift();
        if (inferTimes.length > 60) inferTimes.shift();
        if (t2 - lastStatsUpdate > 1000) {
          const med = (a: number[]) =>
            [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] ?? 0;
          setStats({
            detectMs: med(detectTimes),
            inferMs: med(inferTimes),
            fps: frames,
          });
          frames = 0;
          lastStatsUpdate = t2;
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
            Semua pemrosesan terjadi di perangkat ini. Tidak ada frame video
            yang dikirim atau disimpan ke server.
          </li>
          <li>
            Kamera hanya aktif selama halaman ini terbuka dan bisa kamu
            hentikan kapan saja.
          </li>
          <li>
            Saat pertama kali, browser mengunduh model deteksi (sekitar 8 MB),
            setelah itu inferensi berjalan offline.
          </li>
        </ul>
        {phase === "error" && (
          <p className="mt-4 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground">
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
    <div>
      <div className="relative overflow-hidden rounded-lg border border-border bg-surface">
        {/* video dan overlay dicerminkan hanya untuk tampilan */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="w-full -scale-x-100"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full -scale-x-100"
        />
        {phase === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <p className="text-sm text-muted">Memuat model dan kamera...</p>
          </div>
        )}
        {phase === "ready" && (
          <div className="absolute left-3 top-3 rounded-md bg-background/90 px-3 py-2 text-sm">
            <span className="text-muted">Terbaca: </span>
            <span className="font-semibold">
              {prediction
                ? `${prediction.letter} (${Math.round(prediction.confidence * 100)}%)`
                : "-"}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted">Peragakan huruf</p>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-4xl font-semibold tracking-tight text-accent">
              {target}
            </span>
            <span className="text-sm text-muted">
              {needTwoHands
                ? `Huruf ${target} memakai dua tangan, tunjukkan keduanya ke kamera.`
                : "Tahan posisinya sebentar sampai dikenali."}
            </span>
          </div>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted">
            <IconCheck width={14} height={14} className="text-accent" />
            {correctCount} huruf berhasil sesi ini
          </p>
        </div>
        <div className="flex flex-col justify-between gap-3">
          {stats && (
            <p className="font-mono text-xs text-muted">
              deteksi {stats.detectMs.toFixed(1)} ms, klasifikasi{" "}
              {stats.inferMs.toFixed(1)} ms, {stats.fps} fps
            </p>
          )}
          <button
            type="button"
            onClick={stop}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface"
          >
            Hentikan kamera
          </button>
        </div>
      </div>
    </div>
  );
}
