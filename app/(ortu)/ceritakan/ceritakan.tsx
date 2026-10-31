"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import * as g from "@/lib/gaya";
import { api } from "@/lib/perangkat/sementara/api";
import { panggil, pesanDari } from "@/lib/perangkat/panggil";
import { useSaya } from "@/lib/perangkat/saya";
import { KepalaHalaman } from "@/components/kepala-halaman";
import { Ikon } from "@/components/ikon";

// O8 Ceritakan sendiri: untuk hari ketika rekaman ditolak atau keluarga tidak ingin merekam.
// Disimpan sebagai data laporan, terpisah dari grafik data terukur.
export function Ceritakan() {
  const rekamanId = useSearchParams().get("rekaman");
  const { data: saya } = useSaya();
  const anak = saya?.anak.nama ?? "anak";
  const terapis = saya?.anak.terapis.nama ?? "terapis";
  const [jawab, setJawab] = useState({ aktivitas: "", sempat_menunggu: "", yang_dilakukan_anak: "", pesan_terapis: "" });
  const [kirim, setKirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [selesai, setSelesai] = useState<string | null>(null);

  const isi = (k: keyof typeof jawab) => (e: React.ChangeEvent<HTMLTextAreaElement>) => setJawab((j) => ({ ...j, [k]: e.target.value }));

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setKirim(true);
    setGalat(null);
    try {
      const r = await panggil(api.laporan, {
        jenis: "ceritakan_sendiri",
        isi: {
          aktivitas: jawab.aktivitas.trim(),
          sempat_menunggu: jawab.sempat_menunggu.trim(),
          yang_dilakukan_anak: jawab.yang_dilakukan_anak.trim(),
          pesan_terapis: jawab.pesan_terapis.trim(),
          rekaman_id: rekamanId,
        },
      });
      setSelesai(r.pesan);
    } catch (err) {
      setGalat(pesanDari(err));
    } finally {
      setKirim(false);
    }
  }

  if (selesai !== null) {
    return (
      <div className="space-y-5">
        <KepalaHalaman />
        <div className="muncul space-y-4">
          <section className="rounded-2xl bg-oranye-muda p-5" role="status">
            <p className="flex items-center gap-2 text-[20px] font-bold text-oranye-tua">
              <Ikon nama="centang" /> Terima kasih
            </p>
            <p className="mt-2 text-[17px] leading-snug">{selesai}</p>
            <p className="mt-2 text-[15px] text-oranye-tua">Cerita ini juga dihitung sebagai hari aktif.</p>
          </section>
          <Link href="/hari-ini" className={g.tombolUtama}>
            Kembali ke Hari ini
          </Link>
        </div>
      </div>
    );
  }

  const pertanyaan: { k: keyof typeof jawab; label: string; contoh: string }[] = [
    { k: "aktivitas", label: "Aktivitas apa yang dikerjakan hari ini?", contoh: "Misalnya: main bebek sebelum mandi" },
    { k: "sempat_menunggu", label: `Apakah sempat menunggu ${anak} bersuara?`, contoh: "Misalnya: sempat, dua kali sampai hitungan lima" },
    { k: "yang_dilakukan_anak", label: `Apa yang ${anak} lakukan atau ucapkan?`, contoh: "Misalnya: bilang \"bek\" sambil menunjuk" },
  ];

  return (
    <div className="pb-4">
      <KepalaHalaman />
      <form onSubmit={simpan} className="muncul space-y-6">
        <header className="space-y-1">
          <p className={g.labelAtas}>Dilaporkan keluarga</p>
          <h1 className={g.judulHalaman}>Ceritakan sendiri</h1>
          <p className="pt-1 text-[16px] text-abu">Tiga pertanyaan singkat. Jawab dengan kata-kata Anda sendiri.</p>
        </header>
        {pertanyaan.map((p, i) => (
          <label key={p.k} className="block space-y-2">
            <span className="flex gap-2 text-[15px] font-semibold">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-oranye-muda text-[13px] font-bold text-oranye-tua">
                {i + 1}
              </span>
              {p.label}
            </span>
            <textarea className={`${g.isian} min-h-20`} value={jawab[p.k]} onChange={isi(p.k)} placeholder={p.contoh} />
          </label>
        ))}
        <label className="block space-y-2">
          <span className="block text-[15px] font-semibold">Pesan untuk {terapis}</span>
          <textarea className={`${g.isian} min-h-20`} value={jawab.pesan_terapis} onChange={isi("pesan_terapis")} placeholder="Boleh dikosongkan" />
          <span className="block text-[13px] text-abu">Bila diisi, pesan ini juga masuk ke halaman Pesan.</span>
        </label>
        {galat ? <p className={g.kotakGalat}>{galat}</p> : null}
        <button
          type="submit"
          disabled={kirim || !(jawab.aktivitas.trim() || jawab.yang_dilakukan_anak.trim())}
          className={g.tombolUtama}
        >
          {kirim ? "Menyimpan…" : "Simpan cerita"}
        </button>
      </form>
    </div>
  );
}
