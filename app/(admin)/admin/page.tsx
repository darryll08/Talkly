"use client";

import { useState, type FormEvent } from "react";
import type { z } from "zod";
import * as g from "@/lib/gaya";
import { API } from "@/lib/kontrak/api";
import { panggil, GalatApi, pesanDari } from "@/lib/perangkat/panggil";
import { useData } from "@/lib/perangkat/use-data";
import { TopbarPanel } from "@/components/topbar-panel";
import { Memuat } from "@/components/memuat";
import { Inisial } from "@/components/inisial";
import { Ikon } from "@/components/ikon";

type Ringkasan = z.output<NonNullable<(typeof API)["adminRingkasan"]["response"]>>;

// A1 Admin Talkly: klinik, akun terapis, dan pembuatan akun terapis baru. Terapis tidak mendaftar sendiri.
export default function Admin() {
  const { data, galat, muatUlang } = useData(API.adminRingkasan, undefined, { masuk: "/keluar?sebagai=admin" });
  const [tambah, setTambah] = useState(false);
  const [baru, setBaru] = useState<{ nama: string; email: string; kata_sandi: string } | null>(null);

  return (
    <>
      <TopbarPanel panel="Admin" nama={data?.admin.nama} sebagai="admin" />
      <main className="mx-auto w-full max-w-5xl space-y-8 px-4 pb-16 pt-8 sm:px-6">
        {galat && !data ? <p className={g.kotakGalat}>{galat}</p> : null}
        {!data && !galat ? <Memuat /> : null}
        {data ? (
          <>
            <header className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-1">
                <p className={g.labelAtas}>Panel admin</p>
                <h1 className={g.judulHalaman}>Klinik dan terapis</h1>
                <p className="text-[15px] text-abu">Buat akun terapis di sini, lalu kirim email dan kata sandinya ke terapis.</p>
              </div>
              {!tambah ? (
                <button type="button" onClick={() => { setTambah(true); setBaru(null); }} className={`${g.tombolUtama} w-auto! px-6`}>
                  <Ikon nama="tambah" ukuran={20} /> Tambah terapis
                </button>
              ) : null}
            </header>

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["Klinik", data.total.klinik],
                  ["Terapis", data.total.terapis],
                  ["Anak", data.total.anak],
                  ["Keluarga aktif", data.total.keluarga],
                ] as const
              ).map(([label, n]) => (
                <div key={label} className={g.kartu}>
                  <dt className="text-[13px] font-medium text-abu">{label}</dt>
                  <dd className={`${g.angkaBesar} pt-1 text-[30px]`}>{n}</dd>
                </div>
              ))}
            </dl>

            {baru ? <AkunJadi akun={baru} tutup={() => setBaru(null)} /> : null}
            {tambah ? (
              <FormTerapis
                klinik={data.klinik}
                batal={() => setTambah(false)}
                selesai={(akun) => {
                  setTambah(false);
                  setBaru(akun);
                  muatUlang();
                }}
              />
            ) : null}

            <DaftarTerapis data={data} muatUlang={muatUlang} />

            <section className="space-y-3">
              <h2 className={g.labelSeksi}>Klinik</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {data.klinik.map((k) => (
                  <li key={k.id} className={`${g.kartu} flex items-center gap-3`}>
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-hijau-muda text-hijau-tua">
                      <Ikon nama="rumah" ukuran={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{k.nama}</span>
                      <span className="block text-[14px] text-abu">
                        {k.terapis} terapis · {k.anak} anak{k.data_contoh ? " · data contoh" : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}
      </main>
    </>
  );
}

function DaftarTerapis({ data, muatUlang }: { data: Ringkasan; muatUlang: () => void }) {
  const [hapus, setHapus] = useState<string | null>(null);
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function hapusAkun(id: string) {
    setProses(true);
    setGalat(null);
    try {
      await panggil(API.adminTerapisHapus, { id });
      setHapus(null);
      muatUlang();
    } catch (e) {
      setGalat(pesanDari(e));
    }
    setProses(false);
  }

  return (
    <section className="space-y-3">
      <h2 className={g.labelSeksi}>Akun terapis</h2>
      {galat ? <p className={g.kotakGalat}>{galat}</p> : null}
      {data.terapis.length === 0 ? (
        <p className={g.kartu}>Belum ada terapis. Tambahkan terapis pertama untuk membuka klinik.</p>
      ) : (
        <ul className={g.daftar}>
          {data.terapis.map((t) => (
            <li key={t.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <Inisial nama={t.nama} nada="abu" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{t.nama}</span>
                  <span className="block truncate text-[14px] text-abu">
                    {t.email} · {t.klinik}
                  </span>
                </span>
                <span className="rounded-full bg-abu-muda px-3 py-1 text-[13px] font-semibold tabular-nums">{t.anak} anak</span>
                {t.data_contoh ? (
                  <span className="text-[13px] text-abu">data contoh</span>
                ) : (
                  <button type="button" onClick={() => setHapus(t.id)} className={`${g.tombolTeks} text-oranye-tua`}>
                    Hapus
                  </button>
                )}
              </div>
              {hapus === t.id ? (
                <div className="mt-3 space-y-3 rounded-2xl bg-oranye-muda p-4">
                  <p className="text-[15px] leading-snug">
                    Akun {t.nama} dihapus dan tidak bisa masuk lagi. {t.anak > 0 ? `${t.anak} anak yang ditanganinya tetap ada tanpa terapis.` : ""}
                  </p>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setHapus(null)} className={`${g.tombolKedua} w-auto! px-6`}>
                      Batal
                    </button>
                    <button type="button" onClick={() => hapusAkun(t.id)} disabled={proses} className={`${g.tombolUtama} w-auto! px-6`}>
                      Hapus akun
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FormTerapis({
  klinik,
  batal,
  selesai,
}: {
  klinik: Ringkasan["klinik"];
  batal: () => void;
  selesai: (akun: { nama: string; email: string; kata_sandi: string }) => void;
}) {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState(buatSandi);
  const [klinikId, setKlinikId] = useState<string>(klinik.find((k) => !k.data_contoh)?.id ?? "baru");
  const [klinikBaru, setKlinikBaru] = useState("");
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function simpan(e: FormEvent) {
    e.preventDefault();
    setProses(true);
    setGalat(null);
    try {
      await panggil(API.adminTerapisBuat, {
        nama: nama.trim(),
        email: email.trim(),
        kata_sandi: kataSandi,
        ...(klinikId === "baru" ? { klinik_baru: klinikBaru.trim() } : { klinik_id: klinikId }),
      });
      selesai({ nama: nama.trim(), email: email.trim(), kata_sandi: kataSandi });
    } catch (err) {
      setGalat(err instanceof GalatApi && err.status === 409 ? "Email ini sudah dipakai akun lain." : pesanDari(err));
      setProses(false);
    }
  }

  const lengkap = nama.trim().length >= 2 && email.includes("@") && kataSandi.length >= 8 && (klinikId !== "baru" || klinikBaru.trim().length >= 2);

  return (
    <form onSubmit={simpan} className={`${g.kartu} space-y-4 p-5`}>
      <h2 className="text-[18px] font-bold">Akun terapis baru</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-[15px] font-medium">Nama panggilan</span>
          <input className={g.isian} value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Kak Dimas" required />
        </label>
        <label className="block space-y-2">
          <span className="text-[15px] font-medium">Email</span>
          <input className={g.isian} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dimas@klinik.id" required />
        </label>
        <label className="block space-y-2">
          <span className="text-[15px] font-medium">Klinik</span>
          <select className={g.isian} value={klinikId} onChange={(e) => setKlinikId(e.target.value)}>
            {klinik.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
            <option value="baru">+ Klinik baru</option>
          </select>
        </label>
        {klinikId === "baru" ? (
          <label className="block space-y-2">
            <span className="text-[15px] font-medium">Nama klinik baru</span>
            <input className={g.isian} value={klinikBaru} onChange={(e) => setKlinikBaru(e.target.value)} placeholder="Klinik Wicara Ceria" />
          </label>
        ) : null}
        <label className="block space-y-2">
          <span className="text-[15px] font-medium">Kata sandi awal</span>
          <span className="flex gap-2">
            <input className={`${g.isian} font-mono`} value={kataSandi} onChange={(e) => setKataSandi(e.target.value)} minLength={8} required />
            <button type="button" onClick={() => setKataSandi(buatSandi())} className={`${g.tombolTeks} shrink-0 px-3`}>
              Acak
            </button>
          </span>
        </label>
      </div>
      {galat ? <p role="alert" className={g.kotakGalat}>{galat}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={!lengkap || proses} className={`${g.tombolUtama} w-auto! px-6`}>
          {proses ? "Membuat akun…" : "Buat akun"}
        </button>
        <button type="button" onClick={batal} className={`${g.tombolKedua} w-auto! px-6`}>
          Batal
        </button>
      </div>
    </form>
  );
}

function AkunJadi({ akun, tutup }: { akun: { nama: string; email: string; kata_sandi: string }; tutup: () => void }) {
  const teks = `Akun Talkly untuk ${akun.nama}\nMasuk: ${typeof window === "undefined" ? "" : window.location.origin}/masuk (tab Terapis)\nEmail: ${akun.email}\nKata sandi: ${akun.kata_sandi}`;
  const [tersalin, setTersalin] = useState(false);
  return (
    <section role="status" className="space-y-3 rounded-2xl bg-hijau-muda p-5 text-hijau-tua">
      <p className="text-[17px] font-bold">Akun {akun.nama} sudah jadi.</p>
      <pre className="whitespace-pre-wrap rounded-xl bg-permukaan p-4 font-mono text-[14px] text-foreground">{teks}</pre>
      <p className="text-[14px]">Kata sandi ini hanya tampil sekali. Salin lalu kirim ke terapis.</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(teks);
              setTersalin(true);
            } catch {}
          }}
          className={`${g.tombolUtama} w-auto! px-6`}
        >
          <Ikon nama="salin" ukuran={18} /> {tersalin ? "Tersalin" : "Salin"}
        </button>
        <button type="button" onClick={tutup} className={`${g.tombolKedua} w-auto! px-6`}>
          Tutup
        </button>
      </div>
    </section>
  );
}

function buatSandi() {
  const huruf = "abcdefghjkmnpqrstuvwxyz23456789";
  const acak = crypto.getRandomValues(new Uint32Array(10));
  return "Tlk-" + Array.from(acak, (n) => huruf[n % huruf.length]).join("");
}
