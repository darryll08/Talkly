"use client";

import { useState } from "react";
import * as g from "@/lib/gaya";
import { API } from "@/lib/kontrak/api";
import { panggil, pesanDari } from "@/lib/perangkat/panggil";
import { useData } from "@/lib/perangkat/use-data";
import { muatSaya } from "@/lib/perangkat/saya";
import { Ikon, type NamaIkon } from "./ikon";
import { Sakelar } from "./sakelar";

type Kunci = "izin_nilai" | "izin_dengar" | "izin_klip";

/** Penjelasan singkat untuk keluarga. Rincian penyedia dan dasar hukum tetap ada di respons /api/saya/izin. */
const SINGKAT: Record<Kunci, { ikon: NamaIkon; isi: string }> = {
  izin_nilai: { ikon: "mikrofon", isi: "Rekaman 1 menit dinilai otomatis supaya Anda mendapat umpan balik." },
  izin_dengar: { ikon: "orang", isi: "Terapis bisa memutar rekaman Anda selama 7 hari, lalu audionya dihapus." },
  izin_klip: { ikon: "bintang", isi: "Momen 5 detik saat anak bersuara disimpan di ponsel ini saja." },
};

// Tiga izin rekaman milik orang yang suaranya direkam (O2, O12). Semua mati sampai dinyalakan.
export function IzinRekaman() {
  const { data, galat, setData } = useData(API.izinLihat);
  const [simpan, setSimpan] = useState<Kunci | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);

  async function ubah(kunci: Kunci, nyala: boolean) {
    if (!data) return;
    setSimpan(kunci);
    setPesan(null);
    try {
      const r = await panggil(API.izinUbah, { [kunci]: nyala });
      setData({ ...data, izin: r.izin });
      muatSaya(true);
      if (r.audio_dihapus) setPesan(`${r.audio_dihapus} audio yang tersimpan sudah dihapus.`);
    } catch (e) {
      setPesan(pesanDari(e));
    } finally {
      setSimpan(null);
    }
  }

  if (!data) return galat ? <p className={g.kotakGalat}>{galat}</p> : <div className="kerangka h-56 w-full rounded-2xl" />;

  return (
    <div className="space-y-2">
      <div className={g.daftar}>
        {data.penjelasan.map((p) => {
          const s = SINGKAT[p.kunci];
          return (
            <div key={p.kunci} className="flex items-start gap-1 pl-4">
              <span
                className={`mt-3.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                  data.izin[p.kunci] ? "bg-hijau-muda text-hijau-tua" : "bg-abu-muda text-abu"
                }`}
              >
                <Ikon nama={s.ikon} ukuran={18} />
              </span>
              <div className="min-w-0 flex-1">
                <Sakelar
                  nyala={data.izin[p.kunci]}
                  ubah={(n) => ubah(p.kunci, n)}
                  nonaktif={simpan !== null}
                  label={p.judul}
                  keterangan={s.isi}
                />
              </div>
            </div>
          );
        })}
      </div>
      {pesan ? (
        <p className={g.kotakGalat} role="status">
          {pesan}
        </p>
      ) : null}
    </div>
  );
}
