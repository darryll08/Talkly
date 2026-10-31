"use client";

import { useEffect, useState } from "react";
import * as g from "@/lib/gaya";
import { API } from "@/lib/kontrak/api";
import { panggil, pesanDari } from "@/lib/perangkat/panggil";
import {
  aktifkanNotifikasi,
  matikanNotifikasi,
  notifikasiAktif,
  PESAN_NOTIFIKASI,
  type KeadaanNotifikasi,
} from "@/lib/perangkat/notifikasi";
import { Sakelar } from "./sakelar";

// Sakelar pengingat (O2b, O12): pengingat aktivitas pada jam rutinitas dan saat beberapa hari tidak aktif.
export function SakelarNotifikasi() {
  const [keadaan, setKeadaan] = useState<KeadaanNotifikasi | null>(null);
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    notifikasiAktif().then(setKeadaan).catch(() => setKeadaan("tidak-didukung"));
  }, []);

  async function ubah(nyala: boolean) {
    setProses(true);
    setGalat(null);
    try {
      setKeadaan(
        nyala
          ? await aktifkanNotifikasi(async (sub) => {
              await panggil(API.pushDaftar, sub as { endpoint: string; keys: { p256dh: string; auth: string } });
            })
          : await matikanNotifikasi(),
      );
    } catch (e) {
      setGalat(e instanceof Error && !("status" in e) ? e.message : pesanDari(e));
    } finally {
      setProses(false);
    }
  }

  const pesan = keadaan === "tidak-didukung" || keadaan === "ditolak" ? PESAN_NOTIFIKASI[keadaan] : null;

  return (
    <div className="space-y-2">
      <div className={g.daftar}>
        <Sakelar
          nyala={keadaan === "aktif"}
          ubah={ubah}
          nonaktif={proses || keadaan === null || keadaan === "tidak-didukung"}
          label="Pengingat"
          keterangan="Pada jam rutinitas, dan ajakan ringan bila beberapa hari belum sempat berlatih."
        />
      </div>
      {pesan ? <p className={g.kotakGalat}>{pesan}</p> : null}
      {galat ? <p className={g.kotakGalat}>{galat}</p> : null}
    </div>
  );
}
