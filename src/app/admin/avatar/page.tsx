import type { Metadata } from "next";
import { AvatarCompare } from "./avatar-compare";

export const metadata: Metadata = {
  title: "Avatar Studio",
  robots: { index: false },
};

/* Alat admin lokal untuk membandingkan kandidat model avatar. */
export default function AvatarComparePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Perbandingan model avatar
      </h1>
      <p className="mt-2 text-sm text-muted">
        Alat admin, hanya untuk memilih model. Kandidat tidak ikut ter-commit.
      </p>
      <div className="mt-6">
        <AvatarCompare />
      </div>
    </div>
  );
}
