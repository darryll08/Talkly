"use client";

import { useEffect, useState } from "react";
import * as g from "@/lib/gaya";
import { API } from "@/lib/kontrak/api";
import { panggil, pesanDari } from "@/lib/perangkat/panggil";
import {
  daftarKartuBenda,
  hapusKartuBenda,
  kartuDipakai,
  pakaiKartuBenda,
  perkecilFoto,
  simpanKartuBenda,
  type KartuBenda,
} from "@/lib/perangkat/klip";
import { KepalaHalaman } from "@/components/kepala-halaman";
import { Ikon } from "@/components/ikon";
import { KepalaHijau } from "@/components/kepala-hijau";

type Tampil = KartuBenda & { url: string };

// O4b Kartu foto benda. Foto disimpan di ponsel saja; hanya nama benda yang dikirim ke server.
export default function KartuFotoBenda() {
  const [foto, setFoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [nama, setNama] = useState("");
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [daftar, setDaftar] = useState<Tampil[]>([]);
  const [buka, setBuka] = useState<Tampil | null>(null);
  const [dipakai, setDipakai] = useState<Record<string, string>>({});

  /** Kartu yang tampil di kartu aktivitas untuk kata ini: pilihan keluarga, atau yang terbaru. */
  function sedangDipakai(k: Tampil) {
    const id = dipakai[k.kata];
    return id ? id === k.id : daftar.find((x) => x.kata === k.kata)?.id === k.id;
  }

  function pakai(k: Tampil) {
    pakaiKartuBenda(k);
    setDipakai(kartuDipakai());
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
      };
      await simpanKartuBenda(kartu);
      // Kartu baru langsung dipakai untuk katanya; kartu lama tetap tersimpan dan bisa dipilih lagi.
      pakaiKartuBenda(kartu);
      setDipakai(kartuDipakai());
      setBuka({ ...kartu, url: foto.url });
      setFoto(null);
      setNama("");
      await muat();
    } catch (err) {
      setGalat(pesanDari(err));
    } finally {
      setProses(false);
    }
  }

  async function hapus(id: string) {
    await hapusKartuBenda(id);
    if (buka?.id === id) setBuka(null);
    await muat();
  }

  if (buka) {
    return (
      <div className="pb-4">
        <KepalaHalaman kembali="/kartu-benda" />
        <div className="muncul space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- blob lokal */}
          <img src={buka.url} alt={buka.nama_benda} className="aspect-square w-full rounded-3xl object-cover shadow-kartu" />
          <p className="text-center text-[44px] font-bold text-hijau-tua">{buka.kata}</p>
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
          {galat ? <p className={g.kotakGalat}>{galat}</p> : null}
          {sedangDipakai(buka) ? (
            <p className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-permukaan text-[16px] font-semibold ring-1 ring-garis">
              <Ikon nama="centang" ukuran={20} /> Dipakai di kartu aktivitas &ldquo;{buka.kata}&rdquo;
            </p>
          ) : (
            <button type="button" onClick={() => pakai(buka)} className={g.tombolUtama}>
              Pakai kartu ini untuk &ldquo;{buka.kata}&rdquo;
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
          {galat ? <p className={g.kotakGalat}>{galat}</p> : null}
          <button type="submit" disabled={!foto || !nama.trim() || proses} className={g.tombolUtama}>
            {proses ? "Membuat kartu…" : "Buat kartu"}
          </button>
        </form>

        {daftar.length > 0 ? (
          <section className="space-y-2">
            <h2 className={g.labelSeksi}>Kartu tersimpan</h2>
            <ul className="grid grid-cols-2 gap-3">
              {daftar.map((k) => (
                <li key={k.id} className="overflow-hidden rounded-2xl bg-permukaan shadow-kartu">
                  <button type="button" onClick={() => setBuka(k)} className="tekan block w-full text-left">
                    {/* eslint-disable-next-line @next/next/no-img-element -- blob lokal */}
                    <img src={k.url} alt={k.nama_benda} className="aspect-square w-full object-cover" />
                    <span className="block px-3 pt-2 text-[17px] font-bold">{k.kata}</span>
                  </button>
                  <div className="flex items-center justify-between px-1">
                    {sedangDipakai(k) ? (
                      <span className="inline-flex min-h-11 items-center gap-1 px-2 text-[14px] font-semibold">
                        <Ikon nama="centang" ukuran={16} /> Dipakai
                      </span>
                    ) : (
                      <button type="button" onClick={() => pakai(k)} className={`${g.tombolTeks} px-2 text-[14px]`}>
                        Pakai
                      </button>
                    )}
                    <button type="button" onClick={() => hapus(k.id)} className={`${g.tombolTeks} px-2 text-[14px] text-abu`}>
                      Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
