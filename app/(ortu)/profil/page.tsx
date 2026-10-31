"use client";

import { useState } from "react";
import type { z } from "zod";
import * as g from "@/lib/gaya";
import { API, type Peran } from "@/lib/kontrak/api";
import { panggil, pesanDari } from "@/lib/perangkat/panggil";
import { useData } from "@/lib/perangkat/use-data";
import { useSaya } from "@/lib/perangkat/saya";
import { keluarSekarang } from "@/lib/perangkat/sesi-contoh";
import { Memuat } from "@/components/memuat";
import { Inisial } from "@/components/inisial";
import { IzinRekaman } from "@/components/izin-rekaman";
import { SakelarNotifikasi } from "@/components/sakelar-notifikasi";
import { PasangAplikasi } from "@/components/pasang-aplikasi";
import { KodeQr } from "@/components/kode-qr";
import { Pil } from "@/components/pil";
import { Ikon } from "@/components/ikon";
import { KepalaHijau } from "@/components/kepala-hijau";

const PERAN: Record<string, string> = { ibu: "Ibu", ayah: "Ayah", pengasuh: "Pengasuh", nenek: "Nenek", kakek: "Kakek", lainnya: "Anggota keluarga" };

// O12 Profil dan privasi, termasuk O12a Undang pengasuh.
export default function Profil() {
  const { data: saya, galat } = useSaya();
  if (galat && !saya) return <div className={`${g.kotakGalat} mt-6`}>{galat}</div>;
  if (!saya) return <Memuat />;
  const { anggota, anak } = saya;

  return (
    <div className="muncul space-y-7 pb-4">
      <KepalaHijau
        judul={
          <span className="flex items-center gap-4">
            <Inisial nama={anggota.nama} ukuran={64} nada="oranye" />
            <span className="min-w-0">
              {anggota.nama}
              <span className="font-sans mt-1 block text-[14px] font-medium leading-snug text-teks-di-hijau">
                {PERAN[anggota.peran]}
                {anggota.pengelola ? " · pengelola keluarga" : ""} · Program {anak.nama} bersama {anak.terapis.nama}
              </span>
            </span>
          </span>
        }
      />

      <section className="relative z-10 -mt-9 space-y-2">
        <IzinRekaman />
      </section>

      <section className="space-y-2">
        <h2 className={g.labelSeksi}>Pengingat</h2>
        <SakelarNotifikasi />
        <PasangAplikasi />
      </section>

      <KodeMasuk />

      {anggota.pengelola ? <AnggotaKeluarga /> : null}
      {anggota.pengelola ? <UndangPengasuh anakId={anak.id} /> : null}

      <Akun nama={anak.nama} />
    </div>
  );
}

function KodeMasuk() {
  const [kode, setKode] = useState<string | null>(null);
  const [tanya, setTanya] = useState(false);
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function buat() {
    setProses(true);
    setGalat(null);
    try {
      const r = await panggil(API.kodeMasukBaru);
      setKode(r.kode_masuk);
      setTanya(false);
    } catch (e) {
      setGalat(pesanDari(e));
    } finally {
      setProses(false);
    }
  }

  return (
    <section className="space-y-2">
      <h2 className={g.labelSeksi}>Kode masuk pribadi</h2>
      <div className={`${g.kartu} space-y-3`}>
        {kode ? (
          <div className="space-y-2 rounded-xl bg-oranye-muda p-3">
            <p className="select-all break-all font-mono text-[24px] font-bold tracking-wider">{kode}</p>
            <p className="text-[14px] leading-snug">Kode ini hanya tampil sekali. Foto atau catat sekarang. Kode lama sudah tidak berlaku.</p>
          </div>
        ) : (
          <p className="text-[15px] leading-snug text-abu">
            Dipakai saat ganti ponsel. Bila kode lama mungkin dilihat orang lain, buat kode baru.
          </p>
        )}
        {tanya ? (
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setTanya(false)} className={g.tombolKedua}>
              Batal
            </button>
            <button type="button" onClick={buat} disabled={proses} className={g.tombolUtama}>
              Buat kode
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setTanya(true)} className={g.tombolKedua}>
            Buat kode masuk baru
          </button>
        )}
        {galat ? <p className={g.kotakGalat}>{galat}</p> : null}
      </div>
    </section>
  );
}

function AnggotaKeluarga() {
  const { data, muatUlang } = useData(API.keluargaMingguIni);
  const [cabut, setCabut] = useState<string | null>(null);
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function cabutAkses(id: string) {
    setProses(true);
    setGalat(null);
    try {
      await panggil(API.anggotaHapus, { id });
      setCabut(null);
      muatUlang();
    } catch (e) {
      setGalat(pesanDari(e));
    } finally {
      setProses(false);
    }
  }

  return (
    <section className="space-y-2">
      <h2 className={g.labelSeksi}>Anggota keluarga</h2>
      {!data ? (
        <div className="kerangka h-28 w-full rounded-2xl" />
      ) : (
        <ul className={g.daftar}>
          {data.anggota.map((a) => (
            <li key={a.id} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <Inisial nama={a.nama} ukuran={36} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">
                    {a.nama}
                    {a.saya ? <span className="font-normal text-abu"> (Anda)</span> : null}
                  </span>
                  <span className="block text-[14px] text-abu">{PERAN[a.peran]}</span>
                </span>
                {!a.saya ? (
                  <button type="button" onClick={() => setCabut(a.id)} className={`${g.tombolTeks} text-oranye-tua`}>
                    Cabut akses
                  </button>
                ) : null}
              </div>
              {cabut === a.id ? (
                <div className="mt-3 space-y-3 rounded-xl bg-oranye-muda p-3">
                  <p className="text-[15px] leading-snug">
                    {a.nama} akan langsung keluar dari Talkly di ponselnya, dan rekaman serta audio miliknya dihapus.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setCabut(null)} className={g.tombolKedua}>
                      Batal
                    </button>
                    <button type="button" onClick={() => cabutAkses(a.id)} disabled={proses} className={g.tombolUtama}>
                      Cabut akses
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {galat ? <p className={g.kotakGalat}>{galat}</p> : null}
    </section>
  );
}

type Undangan = z.output<NonNullable<(typeof API)["undanganBuat"]["response"]>>;

function UndangPengasuh({ anakId }: { anakId: string }) {
  const [peran, setPeran] = useState<Peran>("pengasuh");
  const [undangan, setUndangan] = useState<Undangan | null>(null);
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function buat() {
    setProses(true);
    setGalat(null);
    try {
      setUndangan(await panggil(API.undanganBuat, { anak_id: anakId, peran }));
    } catch (e) {
      setGalat(pesanDari(e));
    } finally {
      setProses(false);
    }
  }

  async function bagikan() {
    if (!undangan) return;
    const teks = `Gabung ke latihan Talkly dengan kode ${undangan.kode}`;
    try {
      if (navigator.share) await navigator.share({ title: "Undangan Talkly", text: teks, url: undangan.tautan });
      else await navigator.clipboard.writeText(`${teks}: ${undangan.tautan}`);
    } catch {}
  }

  return (
    <section id="undang" className="scroll-mt-6 space-y-2">
      <h2 className={g.labelSeksi}>Undang pengasuh</h2>
      <div className={`${g.kartu} space-y-4`}>
        {undangan ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <KodeQr teks={undangan.tautan} ukuran={200} label={`QR undangan, kode ${undangan.kode}`} />
            <p className="font-mono text-[28px] font-bold tracking-[0.18em]">{undangan.kode}</p>
            <p className="text-[14px] text-abu">
              Berlaku sampai{" "}
              {new Date(undangan.kedaluwarsa).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}. Izin
              rekaman Anda tidak berlaku untuk suara pengasuh.
            </p>
            <button type="button" onClick={bagikan} className={g.tombolUtama}>
              <Ikon nama="bagikan" /> Bagikan
            </button>
            <button type="button" onClick={() => setUndangan(null)} className={`${g.tombolTeks}`}>
              Buat undangan lain
            </button>
          </div>
        ) : (
          <>
            <Pil
              nama="peran-undangan"
              label="Sebagai"
              nilai={peran}
              ubah={setPeran}
              pilihan={[
                { nilai: "pengasuh", label: "Pengasuh" },
                { nilai: "ayah", label: "Ayah" },
                { nilai: "nenek", label: "Nenek" },
                { nilai: "kakek", label: "Kakek" },
                { nilai: "lainnya", label: "Lainnya" },
              ]}
            />
            <button type="button" onClick={buat} disabled={proses} className={g.tombolUtama}>
              {proses ? "Membuat…" : "Buat kode undangan"}
            </button>
          </>
        )}
        {galat ? <p className={g.kotakGalat}>{galat}</p> : null}
      </div>
    </section>
  );
}

function Akun({ nama }: { nama: string }) {
  const [hapus, setHapus] = useState(false);
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const { data: saya } = useSaya();

  async function keluar() {
    setProses(true);
    setGalat(null);
    try {
      await panggil(API.keluar);
      keluarSekarang();
    } catch (e) {
      setGalat(pesanDari(e));
      setProses(false);
    }
  }

  async function hapusAkun() {
    if (!saya) return;
    setProses(true);
    setGalat(null);
    try {
      await panggil(API.anggotaHapus, { id: saya.anggota.id });
      keluarSekarang();
    } catch (e) {
      setGalat(pesanDari(e));
      setProses(false);
    }
  }

  return (
    <section className="space-y-3">
      <h2 className={g.labelSeksi}>Akun</h2>
      <button type="button" onClick={keluar} disabled={proses} className={g.tombolKedua}>
        Keluar dari ponsel ini
      </button>
      {hapus ? (
        <div className="space-y-3 rounded-2xl bg-oranye-muda p-4">
          <p className="text-[15px] leading-snug">
            Semua data Anda di program {nama} akan dihapus: rekaman, audio, catatan, dan izin. Tindakan ini tidak bisa
            dibatalkan.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setHapus(false)} className={g.tombolKedua}>
              Batal
            </button>
            <button type="button" onClick={hapusAkun} disabled={proses} className={g.tombolUtama}>
              Hapus semua
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setHapus(true)} className={`${g.tombolTeks} w-full justify-center text-oranye-tua`}>
          Hapus akun dan semua data saya
        </button>
      )}
      {galat ? <p className={g.kotakGalat}>{galat}</p> : null}
    </section>
  );
}
