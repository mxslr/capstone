/* Kepala halaman fitur: judul display, cakupan singkat, satu kalimat deskripsi. */
export function PageHeader({
  title,
  scope,
  description,
}: {
  title: string;
  scope?: string;
  description: string;
}) {
  return (
    <header>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h1>
      {scope && <p className="mt-1.5 text-xs font-medium text-accent">{scope}</p>}
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{description}</p>
    </header>
  );
}
