"use client";

import { useState } from "react";
import * as g from "@/lib/gaya";
import { Ikon } from "@/components/ikon";
import { Memuat } from "@/components/memuat";
import { Sakelar } from "@/components/sakelar";
import { Pil } from "@/components/pil";
import { Inisial } from "@/components/inisial";
import { Gelembung } from "@/components/gelembung";
import { KodeQr } from "@/components/kode-qr";

const WARNA = [
  ["--background", "#f3f6f5"],
  ["--permukaan", "#ffffff"],
  ["--foreground", "#1f2a28"],
  ["--hijau", "#3a9d8f"],
  ["--hijau-tua", "#2c7a6f"],
  ["--hijau-muda", "#e6f4f1"],
  ["--oranye", "#e8833a"],
  ["--oranye-muda", "#fdf0e6"],
  ["--abu", "#66726f"],
] as const;

export function Contoh() {
  const [nyala, setNyala] = useState(true);
  const [mati, setMati] = useState(false);
  const [kondisi, setKondisi] = useState<"sehat" | "demam" | "rewel" | null>("sehat");

  return (
    <main className={`${g.kolomOrtu} space-y-8 py-8`}>
      <header className="muncul space-y-1">
        <p className={g.labelAtas}>Talkly · dev</p>
        <h1 className={g.judulHalaman}>Sistem tampilan</h1>
      </header>

      <section className="space-y-3">
        <h2 className={g.labelSeksi}>Warna</h2>
        <div className="grid grid-cols-3 gap-2">
          {WARNA.map(([nama, hex]) => (
            <div key={nama} className="overflow-hidden rounded-xl bg-permukaan shadow-kartu">
              <div className="h-12 ring-1 ring-inset ring-garis" style={{ background: `var(${nama})` }} />
              <p className="px-2 py-1.5 text-[11px] leading-tight">
                {nama}
                <br />
                <span className="text-abu">{hex}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className={g.labelSeksi}>Tombol</h2>
        <button className={g.tombolUtama}>
          <Ikon nama="mikrofon" /> Rekam 1 Menit
        </button>
        <button className={g.tombolKedua}>Sudah, tanpa rekam</button>
        <button className={g.tombolUtama} disabled>
          Berhenti
        </button>
        <button className={g.tombolTeks}>Ganti aktivitas</button>
      </section>

      <section className="space-y-3">
        <h2 className={g.labelSeksi}>Isian dan pilihan</h2>
        <input className={g.isian} placeholder="Nama panggilan" />
        <Pil
          nama="kondisi"
          label="Kondisi hari ini"
          nilai={kondisi}
          ubah={setKondisi}
          pilihan={[
            { nilai: "sehat", label: "Sehat" },
            { nilai: "demam", label: "Demam" },
            { nilai: "rewel", label: "Rewel" },
          ]}
        />
        <div className={g.daftar}>
          <Sakelar nyala={nyala} ubah={setNyala} label="Penilaian rekaman" keterangan="Perlu untuk umpan balik." />
          <Sakelar nyala={mati} ubah={setMati} label="Akses dengar terapis" keterangan="Audio disimpan 7 hari." />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className={g.labelSeksi}>Kartu dan angka</h2>
        <div className={g.kartu}>
          <p className={g.labelAtas}>Dari rekaman Anda · terukur</p>
          <p className={`${g.angkaBesar} mt-1 text-5xl text-hijau-tua`}>
            3,8<span className="ml-1 text-xl font-semibold">detik</span>
          </p>
          <p className="text-[15px] text-abu">naik dari 2,1 detik</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={g.labelKata}>bebek</span>
          <span className={g.labelKata}>mandi</span>
          <span className={g.labelKata}>air</span>
        </div>
        <div className={g.kotakGalat}>Kode undangan sudah dipakai.</div>
        <div className={g.daftar}>
          {["Ibu Sari", "Mbak Sri", "Kak Nadia"].map((n) => (
            <div key={n} className={g.barisDaftar}>
              <Inisial nama={n} nada={n.startsWith("Kak") ? "abu" : "hijau"} />
              <span className="flex-1 font-medium">{n}</span>
              <Ikon nama="panah-kanan" ukuran={18} className="text-abu" />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className={g.labelSeksi}>Gelembung</h2>
        <Gelembung milikSendiri={false} nama="Kak Nadia" waktu="09.12">
          Bagus sekali, Bu. Coba tunggu lima hitungan ya.
        </Gelembung>
        <Gelembung milikSendiri nama="Anda" waktu="09.20" konteks="Catatan malam 31/10">
          Raka sedang demam, Kak.
        </Gelembung>
      </section>

      <section className="space-y-3">
        <h2 className={g.labelSeksi}>QR</h2>
        <KodeQr teks="https://talkly.app/gabung?kode=AB12CD34" label="QR undangan contoh" />
      </section>

      <section className="space-y-3">
        <h2 className={g.labelSeksi}>Memuat</h2>
        <Memuat />
      </section>
    </main>
  );
}
