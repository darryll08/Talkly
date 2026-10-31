"use client";

import { useState } from "react";
import * as g from "@/lib/gaya";
import { API } from "@/lib/kontrak/api";
import { panggil, pesanDari } from "@/lib/perangkat/panggil";
import { useData } from "@/lib/perangkat/use-data";
import { muatSaya } from "@/lib/perangkat/saya";
import { Sakelar } from "./sakelar";

type Kunci = "izin_nilai" | "izin_dengar" | "izin_klip";

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
        {data.penjelasan.map((p) => (
          <Sakelar
            key={p.kunci}
            nyala={data.izin[p.kunci]}
            ubah={(n) => ubah(p.kunci, n)}
            nonaktif={simpan !== null}
            label={p.judul}
            keterangan={
              <>
                <span className="block font-medium text-foreground/80">{p.wajib_untuk}</span>
                <span className="mt-1 block">{p.isi}</span>
                <span className="mt-1 block text-[13px]">
                  Diproses oleh {p.penyedia} · {p.negara}
                </span>
              </>
            }
          />
        ))}
      </div>
      <p className="px-1 text-[13px] leading-snug text-abu">
        Izin ini hanya untuk suara Anda sendiri. Anggota keluarga lain mengatur izinnya di ponsel masing-masing. Dasar:{" "}
        {data.dasar_hukum}.
      </p>
      {pesan ? (
        <p className={g.kotakGalat} role="status">
          {pesan}
        </p>
      ) : null}
    </div>
  );
}
