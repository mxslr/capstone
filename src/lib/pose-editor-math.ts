/*
 * Konversi antara vektor orientasi pose (fingerDir, palmNormal) dan
 * parameter slider Pose Studio (azimuth, elevasi, roll) dalam derajat.
 * Sumbu dunia: x kanan layar, y atas, z ke arah kamera.
 */

export type Vec3 = [number, number, number];

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

function norm(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/* elevasi 90 = lurus ke atas, 0 = mendatar; azimuth 0 = ke kamera,
 * 90 = ke kanan layar */
export function dirFromAngles(azDeg: number, elDeg: number): Vec3 {
  const az = azDeg * D2R;
  const el = elDeg * D2R;
  return [
    Math.cos(el) * Math.sin(az),
    Math.sin(el),
    Math.cos(el) * Math.cos(az),
  ];
}

export function anglesFromDir(v: Vec3): { az: number; el: number } {
  const n = norm(v);
  return {
    az: Math.atan2(n[0], n[2]) * R2D,
    el: Math.asin(Math.max(-1, Math.min(1, n[1]))) * R2D,
  };
}

/* kerangka referensi tegak lurus arah jari, untuk parameter roll telapak */
function rollFrame(dir: Vec3): { u: Vec3; w: Vec3 } {
  const d = norm(dir);
  const ref: Vec3 = Math.abs(d[1]) > 0.9 ? [0, 0, 1] : [0, 1, 0];
  const u = norm(cross(ref, d));
  const w = norm(cross(d, u));
  return { u, w };
}

export function normalFromRoll(dir: Vec3, rollDeg: number): Vec3 {
  const { u, w } = rollFrame(dir);
  const r = rollDeg * D2R;
  return norm([
    u[0] * Math.cos(r) + w[0] * Math.sin(r),
    u[1] * Math.cos(r) + w[1] * Math.sin(r),
    u[2] * Math.cos(r) + w[2] * Math.sin(r),
  ]);
}

export function rollFromNormal(dir: Vec3, n: Vec3): number {
  const { u, w } = rollFrame(dir);
  const d = norm(dir);
  const nd = dot(n, d);
  const proj: Vec3 = [n[0] - d[0] * nd, n[1] - d[1] * nd, n[2] - d[2] * nd];
  return Math.atan2(dot(proj, w), dot(proj, u)) * R2D;
}
