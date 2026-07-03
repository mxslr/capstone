import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="max-w-xs">
          <p className="text-sm font-semibold tracking-tight">SAPA</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Platform aksesibilitas BISINDO. Versi awal, cakupan saat ini terbatas
            pada alfabet dan kosakata dasar, dikembangkan bersama masukan komunitas.
          </p>
        </div>
        <nav aria-label="Tautan footer" className="flex gap-10 text-sm">
          <div className="flex flex-col gap-2">
            <p className="font-medium">Produk</p>
            <Link href="/fitur" className="text-muted hover:text-foreground">
              Fitur
            </Link>
            <Link href="/tentang" className="text-muted hover:text-foreground">
              Tentang
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-medium">Prinsip</p>
            <p className="text-muted">Privasi kamera on-device</p>
            <p className="text-muted">Cakupan yang jujur</p>
          </div>
        </nav>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-5xl px-4 py-4 text-xs text-muted sm:px-6">
          SAPA adalah proyek dalam pengembangan. Materi isyarat belum melalui
          validasi linguistik menyeluruh oleh komunitas Tuli.
        </p>
      </div>
    </footer>
  );
}
