import type { ResponseDari } from "@/lib/kontrak/api";
import { AudioRekaman } from "./audio-rekaman";

type Rekaman = NonNullable<ResponseDari<"anakKartu">["rekaman_terpilih"]>;
export function PitaPercakapan({ rekaman }: { rekaman: Rekaman }) {
  const durasi = rekaman.durasi_s;
  if (!Number.isFinite(durasi) || durasi <= 0) return <p className="text-abu">Durasi rekaman belum tersedia.</p>;
  const x = (detik: number) => 28 + Math.max(0, Math.min(durasi, detik)) / durasi * 640;
  return (
    <figure className="space-y-3">
      <figcaption className="text-sm text-abu">Ajakan orang tua (hijau) · suara anak (oranye). Angka pada daftar adalah jeda setelah ajakan.</figcaption>
      <svg viewBox="0 0 700 112" className="w-full" role="img" aria-label={`Pita percakapan ${durasi} detik, ${rekaman.ajakan.length} ajakan dan ${rekaman.suara_anak.length} suara anak. Rincian teks tersedia di bawah.`}>
        <text x="28" y="14" fontSize="12" fill="currentColor">Orang tua</text><text x="28" y="63" fontSize="12" fill="currentColor">Anak</text>
        <path d="M28 41H668 M28 90H668" stroke="currentColor" opacity=".15" />
        {rekaman.ajakan.map((a, i) => <rect key={i} x={x(a.t_mulai)} y="23" width={Math.max(2, x(a.t_selesai) - x(a.t_mulai))} height="18" rx="3" className="fill-hijau"><title>{a.teks}, jeda {a.jeda_s} detik</title></rect>)}
        {rekaman.suara_anak.map((a, i) => <rect key={i} x={x(a.t_mulai)} y="72" width={Math.max(2, x(a.t_selesai) - x(a.t_mulai))} height="18" rx="3" className="fill-oranye"><title>Suara anak pada {a.t_mulai} detik</title></rect>)}
        {[0, durasi / 2, durasi].map((t) => <text key={t} x={x(t)} y="108" textAnchor="middle" fontSize="12" fill="currentColor">{t.toFixed(0)} dtk</text>)}
      </svg>
      <ol className="space-y-2 text-sm">{rekaman.ajakan.map((a, i) => <li key={i} className="rounded-xl bg-background p-3"><span className="font-semibold tabular-nums">{a.t_mulai.toFixed(1)} dtk</span> · “{a.teks}”<p className="mt-1 text-abu">Jeda {a.jeda_s.toFixed(1)} detik · {a.kategori.replaceAll("_", " ")}</p>{rekaman.bisa_didengar && <AudioRekaman id={rekaman.id} mulai={a.t_mulai} />}</li>)}</ol>
    </figure>
  );
}
