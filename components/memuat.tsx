// Keadaan memuat: kerangka judul + dua kartu, pengganti tulisan "Memuat…".
export function Memuat({ label = "Memuat" }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-4 py-6">
      <div className="kerangka h-3.5 w-24" />
      <div className="kerangka h-8 w-56" />
      <div className="kerangka h-32 w-full rounded-2xl" />
      <div className="kerangka h-24 w-full rounded-2xl" />
    </div>
  );
}
