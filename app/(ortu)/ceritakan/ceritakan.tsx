"use client";

import Link from "next/link";
import { useState } from "react";
import * as g from "@/lib/gaya";
import { API } from "@/lib/kontrak/api";
import { panggil, pesanDari } from "@/lib/perangkat/panggil";
import { useData } from "@/lib/perangkat/use-data";
import { useSaya } from "@/lib/perangkat/saya";
import { KepalaHalaman } from "@/components/kepala-halaman";
import { Pil } from "@/components/pil";
import { Ikon } from "@/components/ikon";
import { KepalaHijau } from "@/components/kepala-hijau";

type Bersuara = "ya" | "sedikit" | "belum";
const LAINNYA = "lainnya";

// O8 Ceritakan sendiri: untuk hari ketika rekaman ditolak atau keluarga tidak ingin merekam.
// Disimpan sebagai data laporan, terpisah dari grafik data terukur.
export function Ceritakan() {
  const { data: saya } = useSaya();
  const hariIni = useData(API.hariIni);
  const anak = saya?.anak.nama ?? "anak";
  const terapis = saya?.anak.terapis.nama ?? "terapis";
  const [aktivitas, setAktivitas] = useState<string | null>(null);
  const [bersuara, setBersuara] = useState<Bersuara | null>(null);
  const [cerita, setCerita] = useState("");
  const [pesan, setPesan] = useState("");
  const [kirim, setKirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [selesai, setSelesai] = useState<string | null>(null);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!bersuara) return;
    setKirim(true);
    setGalat(null);
    try {
      const r = await panggil(API.laporan, {
        jenis: "ceritakan_sendiri",
        isi: {
          aktivitas_id: aktivitas && aktivitas !== LAINNYA ? aktivitas : null,
          anak_bersuara: bersuara,
          cerita: cerita.trim(),
          pesan_untuk_terapis: pesan.trim() || undefined,
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

  const pilihanAktivitas = [
    ...(hariIni.data?.aktivitas ?? []).map((a) => ({ nilai: a.aktivitas_id, label: a.judul })),
    { nilai: LAINNYA, label: "Lainnya" },
  ];

  return (
    <div className="pb-4">
      <form onSubmit={simpan} className="muncul space-y-6">
        <KepalaHijau kembali="/hari-ini" atas="Dilaporkan keluarga" judul="Ceritakan sendiri" rapat>
          <p className="text-[16px] text-teks-di-hijau">Tiga pertanyaan singkat. Jawab dengan kata-kata Anda sendiri.</p>
        </KepalaHijau>

        <Pil nama="aktivitas" label="1. Aktivitas apa yang dikerjakan hari ini?" nilai={aktivitas} ubah={setAktivitas} pilihan={pilihanAktivitas} />

        <Pil
          nama="bersuara"
          label={`2. Saat Anda menunggu, apakah ${anak} bersuara?`}
          nilai={bersuara}
          ubah={setBersuara}
          pilihan={[
            { nilai: "ya", label: "Ya" },
            { nilai: "sedikit", label: "Sedikit" },
            { nilai: "belum", label: "Belum" },
          ]}
        />

        <label className="block space-y-2">
          <span className="block text-[15px] font-semibold">3. Apa yang {anak} lakukan atau ucapkan?</span>
          <textarea
            className={`${g.isian} min-h-24`}
            value={cerita}
            onChange={(e) => setCerita(e.target.value)}
            placeholder={'Misalnya: bilang "bek" sambil menunjuk bebek'}
          />
        </label>

        <label className="block space-y-2">
          <span className="block text-[15px] font-semibold">Pesan untuk {terapis}</span>
          <textarea className={`${g.isian} min-h-20`} value={pesan} onChange={(e) => setPesan(e.target.value)} placeholder="Boleh dikosongkan" />
          <span className="block text-[13px] text-abu">Bila diisi, pesan ini juga masuk ke halaman Pesan.</span>
        </label>

        {galat ? <p className={g.kotakGalat}>{galat}</p> : null}
        <button type="submit" disabled={kirim || !bersuara || !cerita.trim()} className={g.tombolUtama}>
          {kirim ? "Menyimpan…" : "Simpan cerita"}
        </button>
      </form>
    </div>
  );
}
