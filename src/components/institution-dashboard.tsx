"use client";

/*
 * Dashboard institusi sederhana: memantau progres pelatihan per perangkat
 * dari log latihan di Supabase. MVP tanpa autentikasi, identitas berupa
 * kode perangkat anonim, dijelaskan jujur di UI.
 */

import { useEffect, useState } from "react";
import { IconChart } from "@/components/icons";
import { getDeviceId, getSupabase } from "@/lib/supabase";

type DeviceStats = {
  device_id: string;
  total_reviews: number;
  accuracy_pct: number;
  items_practiced: number;
  quiz_reviews: number;
  roleplay_reviews: number;
  arena_reviews: number;
  last_active: string;
};

export function InstitutionDashboard() {
  const [rows, setRows] = useState<DeviceStats[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myDevice, setMyDevice] = useState("");

  useEffect(() => {
    setMyDevice(getDeviceId());
    const supabase = getSupabase();
    if (!supabase) {
      setError("Supabase belum dikonfigurasi di build ini.");
      return;
    }
    supabase
      .from("device_stats")
      .select("*")
      .order("last_active", { ascending: false })
      .limit(50)
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setRows((data as DeviceStats[]) ?? []);
      });
  }, []);

  if (error) {
    return (
      <p className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
        Gagal memuat data: {error}
      </p>
    );
  }
  if (!rows) return <p className="text-sm text-muted">Memuat data...</p>;

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border p-6 text-center">
        <IconChart className="mx-auto text-accent" />
        <p className="mt-3 text-sm text-muted">
          Belum ada aktivitas latihan yang tercatat. Mulai dari kuis harian
          atau roleplay, lalu kembali ke sini.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-left">
            <th className="px-4 py-2.5 font-medium">Perangkat</th>
            <th className="px-4 py-2.5 font-medium">Total latihan</th>
            <th className="px-4 py-2.5 font-medium">Akurasi</th>
            <th className="px-4 py-2.5 font-medium">Materi disentuh</th>
            <th className="px-4 py-2.5 font-medium">Kuis</th>
            <th className="px-4 py-2.5 font-medium">Roleplay</th>
            <th className="px-4 py-2.5 font-medium">Terakhir aktif</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.device_id} className="border-b border-border last:border-0">
              <td className="px-4 py-2.5 font-mono text-xs">
                {r.device_id.slice(0, 8)}
                {r.device_id === myDevice && (
                  <span className="ml-2 rounded-full border border-accent px-2 py-0.5 text-xs font-medium text-accent">
                    perangkat ini
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5">{r.total_reviews}</td>
              <td className="px-4 py-2.5">{r.accuracy_pct}%</td>
              <td className="px-4 py-2.5">{r.items_practiced}</td>
              <td className="px-4 py-2.5">{r.quiz_reviews}</td>
              <td className="px-4 py-2.5">{r.roleplay_reviews}</td>
              <td className="px-4 py-2.5 text-muted">
                {new Date(r.last_active).toLocaleString("id-ID", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
