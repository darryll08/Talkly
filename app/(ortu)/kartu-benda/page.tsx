"use client";

import { useEffect, useState } from "react";
import * as g from "@/lib/gaya";
import { API } from "@/lib/kontrak/api";
import { panggil, pesanDari } from "@/lib/perangkat/panggil";
import {
  daftarKartuBenda,
  hapusKartuBenda,
  kartuDipakai,
  kartuUntukKata,
  LAINNYA,
  lepasKartuBenda,
  lupakanPilihanKartu,
  pakaiKartuBenda,
  perkecilFoto,
  simpanKartuBenda,
  slotKartu,
  type KartuBenda,
} from "@/lib/perangkat/klip";
import { useSaya } from "@/lib/perangkat/saya";
import { KepalaHalaman } from "@/components/kepala-halaman";
import { Ikon } from "@/components/ikon";
import { KepalaHijau } from "@/components/kepala-hijau";

type Tampil = KartuBenda & { url: string };

/** Pilihan kata target untuk satu kartu. "" = kartu bebas (tidak dihubungkan ke kata target). */
function PilihKata({ kata, nilai, ubah }: { kata: string[]; nilai: string; ubah: (k: string) => void }) {
  if (kata.length === 0) return null;
  const chip = (aktif: boolean) =>
    `tekan inline-flex min-h-11 items-center gap-1 rounded-full px-4 text-[15px] font-semibold ${
      aktif ? "bg-hijau text-white" : "bg-permukaan text-foreground ring-1 ring-garis"
    }`;
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Untuk kata">
      {kata.map((k) => (
        <button key={k} type="button" role="radio" aria-checked={nilai === k} onClick={() => ubah(k)} className={chip(nilai === k)}>
          {nilai === k ? <Ikon nama="centang" ukuran={16} /> : null}
          {k}
        </button>
      ))}
      <button type="button" role="radio" aria-checked={nilai === ""} onClick={() => ubah("")} className={chip(nilai === "")}>
        Lainnya
      </button>
    </div>
  );
}

// O4b Kartu foto benda. Foto disimpan di ponsel saja; hanya nama benda yang dikirim ke server.
// Kartu dihubungkan ke kata target (saran dari bank) atau Lainnya. Kartu Lainnya yang dipilih tampil, dengan
// namanya sendiri, di kartu aktivitas yang belum punya foto untuk kata targetnya.
export default function KartuFotoBenda() {
  const { data: saya } = useSaya();
  const kataTarget = saya?.anak.kata_target ?? [];
  const [foto, setFoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [nama, setNama] = useState("");
  const [untuk, setUntuk] = useState<string | null>(null);
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [daftar, setDaftar] = useState<Tampil[]>([]);
  const [buka, setBuka] = useState<Tampil | null>(null);
  const [dipakai, setDipakai] = useState<Record<string, string>>({});

  // Tanpa pilihan eksplisit, kata target yang sama dengan nama benda dipilih otomatis.
  const namaRapi = nama.trim().toLowerCase();
  const untukKata = untuk ?? (kataTarget.includes(namaRapi) ? namaRapi : "");

  // Sebelum data anak termuat, slot diambil dari untuk_kata yang tersimpan agar label tidak berkedip.
  const slot = (k: KartuBenda) => (saya ? slotKartu(k, kataTarget) : (k.untuk_kata ?? LAINNYA));
  const sedangDipakai = (k: KartuBenda) => kartuUntukKata(daftar, slot(k), dipakai)?.id === k.id;

  function pakai(k: Tampil) {
    pakaiKartuBenda(slot(k), k.id);
    setDipakai(kartuDipakai());
  }

  function lepas(k: Tampil) {
    lepasKartuBenda(slot(k));
    setDipakai(kartuDipakai());
  }

  async function hubungkan(k: Tampil, kata: string) {
    const baru: Tampil = { ...k, untuk_kata: kata || LAINNYA };
    const { url: _url, ...simpanan } = baru;
    void _url;
    await simpanKartuBenda(simpanan);
    pakaiKartuBenda(kata || LAINNYA, baru.id);
    setDipakai(kartuDipakai());
    setBuka(baru);
    await muat();
  }

  async function gantiFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !buka) return;
    setGalat(null);
    try {
      const blob = await perkecilFoto(f);
      const { url: _url, ...kartu } = buka;
      void _url;
      await simpanKartuBenda({ ...kartu, foto: blob });
      setBuka({ ...buka, foto: blob, url: URL.createObjectURL(blob) });
      await muat();
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Foto tidak bisa dibuka.");
    }
  }

  async function muat() {
    const d = await daftarKartuBenda();
    setDaftar((lama) => {
      lama.forEach((k) => URL.revokeObjectURL(k.url));
      return d.map((k) => ({ ...k, url: URL.createObjectURL(k.foto) }));
    });
  }

  useEffect(() => {
    let batal = false;
    daftarKartuBenda().then((d) => {
      if (batal) return;
      setDaftar(d.map((k) => ({ ...k, url: URL.createObjectURL(k.foto) })));
      setDipakai(kartuDipakai());
    });
    return () => {
      batal = true;
    };
  }, []);

  async function pilihFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setGalat(null);
    try {
      const blob = await perkecilFoto(f);
      if (foto) URL.revokeObjectURL(foto.url);
      setFoto({ blob, url: URL.createObjectURL(blob) });
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Foto tidak bisa dibuka.");
    }
  }

  async function buat(e: React.FormEvent) {
    e.preventDefault();
    if (!foto) return;
    setProses(true);
    setGalat(null);
    try {
      const r = await panggil(API.kartuBenda, { nama_benda: nama.trim() });
      const kartu: KartuBenda = {
        id: crypto.randomUUID(),
        nama_benda: nama.trim(),
        kata: r.kata,
        contoh_kalimat: r.contoh_kalimat,
        foto: foto.blob,
        dibuat: Date.now(),
        untuk_kata: untukKata || LAINNYA,
      };
      await simpanKartuBenda(kartu);
      // Kartu baru langsung dipilih untuk slotnya; kartu lama tetap tersimpan dan bisa dipilih lagi.
      pakaiKartuBenda(untukKata || LAINNYA, kartu.id);
      setDipakai(kartuDipakai());
      setBuka({ ...kartu, url: foto.url });
      setFoto(null);
      setNama("");
      setUntuk(null);
      await muat();
    } catch (err) {
      setGalat(pesanDari(err));
    } finally {
      setProses(false);
    }
  }

  async function hapus(id: string) {
    await hapusKartuBenda(id);
    lupakanPilihanKartu(id);
    setDipakai(kartuDipakai());
    if (buka?.id === id) setBuka(null);
    await muat();
  }

  if (buka) {
    const lainnya = slot(buka) === LAINNYA;
    return (
      <div className="pb-4">
        <KepalaHalaman kembali="/kartu-benda" />
        <div className="muncul space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- blob lokal */}
          <img src={buka.url} alt={buka.nama_benda} className="aspect-square w-full rounded-3xl object-cover shadow-kartu" />
          <p className="font-judul text-center text-[44px] font-extrabold text-hijau-tua">{buka.kata}</p>
          <div className="space-y-2">
            {buka.contoh_kalimat.map((k) => (
              <p key={k} className="ml-auto w-fit max-w-[85%] rounded-[20px] rounded-br-md bg-hijau px-4 py-2.5 text-[18px] font-semibold text-white">
                {k}
              </p>
            ))}
          </div>
          <p className="rounded-2xl bg-permukaan p-4 text-[15px] leading-snug text-abu shadow-kartu">
            Tunjukkan beberapa detik sambil menyebut katanya, lalu kembalikan perhatian ke benda aslinya.
          </p>

          <section className="space-y-2">
            <h2 className={g.labelSeksi}>Tampil di aktivitas dengan kata</h2>
            <PilihKata kata={kataTarget} nilai={lainnya ? "" : slot(buka)} ubah={(k) => hubungkan(buka, k)} />
          </section>

          {galat ? <p className={g.kotakGalat}>{galat}</p> : null}
          {sedangDipakai(buka) ? (
            <div className="space-y-2">
              <p className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-hijau-muda px-4 text-center text-[16px] font-semibold text-hijau-tua">
                <Ikon nama="centang" ukuran={20} />
                {lainnya ? <>Tampil di kartu aktivitas sebagai &ldquo;{buka.kata}&rdquo;</> : <>Tampil di kartu aktivitas &ldquo;{slot(buka)}&rdquo;</>}
              </p>
              <button type="button" onClick={() => lepas(buka)} className={`${g.tombolTeks} w-full justify-center text-abu`}>
                Batal pilih
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => pakai(buka)} className={g.tombolUtama}>
              Pilih kartu ini
            </button>
          )}
          <label className={`${g.tombolKedua} cursor-pointer`}>
            <Ikon nama="kamera" ukuran={20} /> Ganti foto
            <input type="file" accept="image/*" capture="environment" onChange={gantiFoto} className="sr-only" />
          </label>
          <button type="button" onClick={() => setBuka(null)} className={`${g.tombolTeks} w-full justify-center`}>
            Selesai
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="muncul space-y-6">
        <KepalaHijau kembali="/hari-ini" atas="Kartu foto benda" judul="Benda kesukaan anak" rapat>
          <p className="text-[16px] text-teks-di-hijau">Foto ini hanya tersimpan di HP ini.</p>
        </KepalaHijau>

        <form onSubmit={buat} className="space-y-4">
          <label className="tekan flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-3xl border-2 border-dashed border-hijau/40 bg-permukaan text-hijau-tua">
            {foto ? (
              // eslint-disable-next-line @next/next/no-img-element -- blob lokal
              <img src={foto.url} alt="Pratinjau foto" className="h-full w-full object-cover" />
            ) : (
              <>
                <Ikon nama="kamera" ukuran={36} />
                <span className="text-[16px] font-semibold">Ambil foto benda</span>
              </>
            )}
            <input type="file" accept="image/*" capture="environment" onChange={pilihFoto} className="sr-only" />
          </label>
          <label className="block space-y-2">
            <span className="block text-[15px] font-semibold">Nama benda</span>
            <input className={g.isian} value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Misalnya: bebek" maxLength={40} />
          </label>
          {kataTarget.length > 0 ? (
            <div className="space-y-2">
              <span className="block text-[15px] font-semibold">Untuk kata</span>
              <PilihKata kata={kataTarget} nilai={untukKata} ubah={setUntuk} />
              <p className="text-[14px] text-abu">
                {untukKata ? `Foto akan muncul di kartu aktivitas "${untukKata}".` : "Lainnya: foto tampil dengan nama yang kamu isi."}
              </p>
            </div>
          ) : null}
          {galat ? <p className={g.kotakGalat}>{galat}</p> : null}
          <button type="submit" disabled={!foto || !nama.trim() || proses} className={g.tombolUtama}>
            {proses ? "Membuat kartu…" : "Buat kartu"}
          </button>
        </form>

        {daftar.length > 0 ? (
          <section className="space-y-2">
            <h2 className={g.labelSeksi}>Kartu tersimpan</h2>
            <ul className="grid grid-cols-2 gap-3">
              {daftar.map((k) => {
                const aktif = sedangDipakai(k);
                return (
                  <li
                    key={k.id}
                    className={`relative overflow-hidden rounded-2xl bg-permukaan shadow-kartu ${aktif ? "ring-2 ring-hijau" : ""}`}
                  >
                    {aktif ? (
                      <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-hijau px-2 py-0.5 text-[12px] font-semibold text-white">
                        <Ikon nama="centang" ukuran={12} /> Dipilih
                      </span>
                    ) : null}
                    <button type="button" onClick={() => setBuka(k)} className="tekan block w-full text-left">
                      {/* eslint-disable-next-line @next/next/no-img-element -- blob lokal */}
                      <img src={k.url} alt={k.nama_benda} className="aspect-square w-full object-cover" />
                      <span className="block px-3 pt-2 text-[17px] font-bold">{k.kata}</span>
                      <span className="block px-3 text-[13px] text-abu">
                        {slot(k) === LAINNYA ? "Lainnya" : `Untuk kata "${slot(k)}"`}
                      </span>
                    </button>
                    <div className="flex items-center justify-between px-1">
                      {aktif ? (
                        <button type="button" onClick={() => lepas(k)} className={`${g.tombolTeks} px-2 text-[14px] text-abu`}>
                          Batal pilih
                        </button>
                      ) : (
                        <button type="button" onClick={() => pakai(k)} className={`${g.tombolTeks} px-2 text-[14px]`}>
                          Pilih
                        </button>
                      )}
                      <button type="button" onClick={() => hapus(k.id)} className={`${g.tombolTeks} px-2 text-[14px] text-abu`}>
                        Hapus
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
