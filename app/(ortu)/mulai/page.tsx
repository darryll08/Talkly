"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as g from "@/lib/gaya";
import { useSaya } from "@/lib/perangkat/saya";
import { IzinRekaman } from "@/components/izin-rekaman";
import { PasangAplikasi } from "@/components/pasang-aplikasi";
import { SakelarNotifikasi } from "@/components/sakelar-notifikasi";
import { KUNCI_KODE_MASUK } from "../gabung/gabung";

const JUDUL = ["Izin rekaman", "Pasang di layar utama", "Minggu pertama"];

// O2 Izin rekaman → O2b Pasang di layar utama → O2c Pengenalan dan kode masuk pribadi.
export default function Mulai() {
  const router = useRouter();
  const { data: saya } = useSaya();
  const [langkah, setLangkah] = useState(0);
  // Kode masuk pribadi dari halaman Gabung, tampil sekali lalu dihapus dari sessionStorage.
  // Baru dipakai di langkah 3, jadi tidak memengaruhi tampilan awal saat hidrasi.
  const [kodeMasuk] = useState<string | null>(() => {
    try {
      return typeof window === "undefined" ? null : sessionStorage.getItem(KUNCI_KODE_MASUK);
    } catch {
      return null;
    }
  });
  useEffect(() => {
    try {
      sessionStorage.removeItem(KUNCI_KODE_MASUK);
    } catch {}
  }, []);

  const anak = saya?.anak.nama ?? "anak";
  const terapis = saya?.anak.terapis.nama ?? "terapis";

  return (
    <div className="space-y-6 pb-4 pt-8">
      <div className="flex gap-2" role="img" aria-label={`Langkah ${langkah + 1} dari 3`}>
        {JUDUL.map((j, i) => (
          <div key={j} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= langkah ? "bg-hijau" : "bg-abu-muda"}`} />
        ))}
      </div>

      <div key={langkah} className="muncul space-y-5">
        <header className="space-y-1">
          <p className={g.labelAtas}>
            Langkah {langkah + 1} dari 3
          </p>
          <h1 className={g.judulHalaman}>{JUDUL[langkah]}</h1>
        </header>

        {langkah === 0 ? (
          <>
            <p className="text-[16px] leading-snug text-abu">
              Ketiganya mati sampai Anda nyalakan, dan bisa diubah kapan saja di Profil. Tanpa izin pertama, Anda tetap bisa
              memakai kartu aktivitas, Catatan malam, dan Ceritakan sendiri.
            </p>
            <IzinRekaman />
          </>
        ) : null}

        {langkah === 1 ? (
          <>
            <PasangAplikasi />
            <SakelarNotifikasi />
          </>
        ) : null}

        {langkah === 2 ? (
          <>
            <ol className={g.daftar}>
              {[
                `Kerjakan aktivitas sekitar 5 menit di rutinitas yang sudah ada, seperti mandi atau makan.`,
                `Setelah mengajak ${anak} bicara, hitung sampai lima dalam hati sebelum bicara lagi.`,
                `Kalau sempat, rekam 1 menit 2–3 kali seminggu. ${terapis} membaca hasilnya sebelum sesi.`,
              ].map((t, i) => (
                <li key={i} className="flex gap-3 px-4 py-3.5">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-hijau-muda text-sm font-bold text-hijau-tua">
                    {i + 1}
                  </span>
                  <span className="text-[16px] leading-snug">{t}</span>
                </li>
              ))}
            </ol>
            {kodeMasuk ? (
              <section className="space-y-2 rounded-2xl bg-oranye-muda p-4">
                <p className="text-[14px] font-semibold text-oranye-tua">Kode masuk pribadi Anda</p>
                <p className="select-all break-all font-mono text-[26px] font-bold tracking-wider">{kodeMasuk}</p>
                <p className="text-[14px] leading-snug">
                  Kode ini hanya tampil sekali. Foto atau catat sekarang; dipakai saat Anda ganti ponsel.
                </p>
              </section>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-3 pt-2">
        {langkah > 0 ? (
          <button type="button" onClick={() => setLangkah((l) => l - 1)} className={`${g.tombolKedua} w-auto px-6`}>
            Kembali
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => (langkah < 2 ? setLangkah((l) => l + 1) : router.replace("/hari-ini"))}
          className={g.tombolUtama}
        >
          {langkah < 2 ? "Lanjut" : "Mulai latihan"}
        </button>
      </div>
    </div>
  );
}
