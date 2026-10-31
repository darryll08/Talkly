"use client";

import Link from "next/link";
import { useState } from "react";
import * as g from "@/lib/gaya";
import { API } from "@/lib/kontrak/api";
import { panggil, pesanDari } from "@/lib/perangkat/panggil";
import { useSaya } from "@/lib/perangkat/saya";
import { KepalaHalaman } from "@/components/kepala-halaman";
import { Pil } from "@/components/pil";
import { Ikon } from "@/components/ikon";

type Dibanding = "sama" | "lebih_banyak" | "lebih_sedikit";
type Kondisi = "sehat" | "demam" | "batuk_pilek" | "rewel" | "lainnya";

// O9 Catatan malam. Data laporan keluarga (oranye), terpisah dari angka terukur.
export default function CatatanMalam() {
  const { data: saya } = useSaya();
  const anak = saya?.anak.nama ?? "anak";
  const [kata, setKata] = useState("");
  const [dibanding, setDibanding] = useState<Dibanding | null>(null);
  const [kondisi, setKondisi] = useState<Kondisi | null>(null);
  const [regresi, setRegresi] = useState(false);
  const [berbeda, setBerbeda] = useState("");
  const [pesan, setPesan] = useState("");
  const [kirim, setKirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [hasil, setHasil] = useState<{ pesan: string; terapis_diberi_tahu: boolean } | null>(null);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setKirim(true);
    setGalat(null);
    try {
      const r = await panggil(API.laporan, {
        jenis: "catatan_malam",
        isi: {
          kata_baru: kata.split(",").map((k) => k.trim()).filter(Boolean),
          catatan: [dibanding === "lebih_banyak" ? "Lebih banyak bersuara dibanding biasanya." : "", berbeda.trim()]
            .filter(Boolean)
            .join(" "),
          kondisi: kondisi ?? "sehat",
          regresi,
          lebih_sedikit_bersuara: dibanding === "lebih_sedikit",
          pesan_untuk_terapis: pesan.trim() || undefined,
        },
      });
      setHasil(r);
    } catch (err) {
      setGalat(pesanDari(err));
    } finally {
      setKirim(false);
    }
  }

  if (hasil) {
    return (
      <div className="space-y-5">
        <KepalaHalaman />
        <div className="muncul space-y-4">
          <section className={hasil.terapis_diberi_tahu ? "rounded-2xl bg-oranye-muda p-5" : `${g.kartu} p-5`} role="status">
            <p className={`flex items-center gap-2 text-[18px] font-bold ${hasil.terapis_diberi_tahu ? "text-oranye-tua" : "text-hijau-tua"}`}>
              <Ikon nama="centang" /> Catatan tersimpan
            </p>
            <p className="mt-2 text-[17px] leading-snug">{hasil.pesan}</p>
          </section>
          <Link href="/hari-ini" className={g.tombolUtama}>
            Kembali ke Hari ini
          </Link>
          {hasil.terapis_diberi_tahu ? (
            <Link href="/pesan" className={g.tombolKedua}>
              Kirim pesan ke {saya?.anak.terapis.nama ?? "terapis"}
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <KepalaHalaman />
      <form onSubmit={simpan} className="muncul space-y-6">
        <header className="space-y-1">
          <p className={g.labelAtas}>Dilaporkan keluarga</p>
          <h1 className={g.judulHalaman}>Catatan malam</h1>
        </header>

        <label className="block space-y-2">
          <span className="block text-[15px] font-semibold">Kata atau suara apa yang diucapkan {anak} hari ini?</span>
          <input
            className={g.isian}
            value={kata}
            onChange={(e) => setKata(e.target.value)}
            placeholder="Misalnya: bek, mam, cing"
            autoComplete="off"
          />
          <span className="block text-[13px] text-abu">Pisahkan dengan koma. Boleh berupa suara, tidak harus kata utuh.</span>
        </label>

        <Pil
          nama="dibanding"
          label="Dibanding biasanya"
          nilai={dibanding}
          ubah={setDibanding}
          pilihan={[
            { nilai: "sama", label: "Sama saja" },
            { nilai: "lebih_banyak", label: "Lebih banyak" },
            { nilai: "lebih_sedikit", label: "Lebih sedikit" },
          ]}
        />

        <Pil
          nama="kondisi"
          label={`Kondisi ${anak}`}
          nilai={kondisi}
          ubah={setKondisi}
          pilihan={[
            { nilai: "sehat", label: "Sehat" },
            { nilai: "demam", label: "Demam" },
            { nilai: "batuk_pilek", label: "Batuk pilek" },
            { nilai: "rewel", label: "Rewel" },
            { nilai: "lainnya", label: "Lainnya" },
          ]}
        />

        <label className={`${g.kartu} flex cursor-pointer items-start gap-3`}>
          <input
            type="checkbox"
            checked={regresi}
            onChange={(e) => setRegresi(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--oranye)]"
          />
          <span className="text-[16px] leading-snug">Ada kata yang dulu sudah bisa, sekarang tidak diucapkan lagi</span>
        </label>

        <label className="block space-y-2">
          <span className="block text-[15px] font-semibold">Ada yang berbeda hari ini?</span>
          <textarea className={`${g.isian} min-h-24`} value={berbeda} onChange={(e) => setBerbeda(e.target.value)} placeholder="Boleh dikosongkan" />
        </label>

        <label className="block space-y-2">
          <span className="block text-[15px] font-semibold">Pesan untuk {saya?.anak.terapis.nama ?? "terapis"}</span>
          <textarea className={`${g.isian} min-h-24`} value={pesan} onChange={(e) => setPesan(e.target.value)} placeholder="Boleh dikosongkan" />
        </label>

        {galat ? <p className={g.kotakGalat}>{galat}</p> : null}
        <button type="submit" disabled={kirim} className={g.tombolUtama}>
          {kirim ? "Menyimpan…" : "Simpan"}
        </button>
      </form>
    </div>
  );
}
