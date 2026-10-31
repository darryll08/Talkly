"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import * as g from "@/lib/gaya";
import { API } from "@/lib/kontrak/api";
import { panggil, pesanDari } from "@/lib/perangkat/panggil";
import { useData } from "@/lib/perangkat/use-data";
import {
  daftarKartuBenda,
  hapusKartuBenda,
  kartuAktivitas,
  kartuDipakai,
  kartuUntukAktivitas,
  kataKartu,
  lupakanPilihanKartu,
  pakaiDiAktivitas,
  pakaiKartuBenda,
  perkecilFoto,
  simpanKartuBenda,
  type KartuBenda,
} from "@/lib/perangkat/klip";
import { useSaya } from "@/lib/perangkat/saya";
import { KepalaHalaman } from "@/components/kepala-halaman";
import { Ikon } from "@/components/ikon";
import { KepalaHijau } from "@/components/kepala-hijau";
import { Memuat } from "@/components/memuat";

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
// Kartu dihubungkan ke salah satu kata target supaya fotonya muncul di kartu aktivitas.
// Dibuka dari kartu aktivitas (?aktivitas=…&judul=…&kata=…), halaman ini memilih foto khusus aktivitas itu.
export default function HalamanKartuBenda() {
  return (
    <Suspense fallback={<Memuat />}>
      <KartuFotoBenda />
    </Suspense>
  );
}

function KartuFotoBenda() {
  const cari = useSearchParams();
  const router = useRouter();
  const aktivitas = cari.get("aktivitas");
  const judulAktivitas = cari.get("judul") ?? "aktivitas ini";
  const kataAktivitas = (cari.get("kata") ?? "").split(",").filter(Boolean);
  const { data: saya } = useSaya();
  const kataTarget = saya?.anak.kata_target ?? [];
  const [diAktivitas, setDiAktivitas] = useState<Record<string, string>>({});
  const { data: hariIni } = useData(API.hariIni, undefined, { simpanLokal: "hari-ini" });
  const aktivitasHariIni = hariIni?.aktivitas ?? [];
  const [foto, setFoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [nama, setNama] = useState("");
  const [untuk, setUntuk] = useState<string | null>(null);
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [daftar, setDaftar] = useState<Tampil[]>([]);
  const [buka, setBuka] = useState<Tampil | null>(null);
  const [, setDipakai] = useState<Record<string, string>>({});

  // Tanpa pilihan eksplisit, kata target yang sama dengan nama benda dipilih otomatis.
  const namaRapi = nama.trim().toLowerCase();
  const untukKata = untuk ?? (kataTarget.includes(namaRapi) ? namaRapi : (kataAktivitas.find((k) => kataTarget.includes(k)) ?? ""));

  // Sebelum data anak termuat, kartu yang punya untuk_kata dianggap terhubung agar label tidak berkedip.
  const terhubung = (k: KartuBenda) => (saya ? kataTarget.includes(kataKartu(k)) : Boolean(k.untuk_kata));
  /** Aktivitas hari ini yang sedang menampilkan kartu ini (pilihan per aktivitas, atau cocok dengan kata targetnya). */
  const tampilDi = (k: KartuBenda) => aktivitasHariIni.filter((a) => kartuUntukAktivitas(daftar, a.item_id, a.kata_target)?.id === k.id);

  function aturAktivitas(k: KartuBenda, itemId: string, tampil: boolean) {
    pakaiDiAktivitas(itemId, tampil ? k.id : "");
    setDiAktivitas(kartuAktivitas());
  }

  /** Kartu yang sekarang tampil di aktivitas yang sedang dipilihkan fotonya. */
  const fotoAktivitas = aktivitas ? kartuUntukAktivitas(daftar, aktivitas, kataAktivitas) : undefined;
  void diAktivitas;

  function pakaiAktivitas(id: string) {
    if (!aktivitas) return;
    pakaiDiAktivitas(aktivitas, id);
    setDiAktivitas(kartuAktivitas());
    if (id) router.push(`/aktivitas/${encodeURIComponent(aktivitas)}`);
  }

  async function hubungkan(k: Tampil, kata: string) {
    const baru: Tampil = { ...k, untuk_kata: kata || undefined };
    const { url: _url, ...simpanan } = baru;
    void _url;
    await simpanKartuBenda(simpanan);
    if (kata) pakaiKartuBenda(baru);
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
      setDiAktivitas(kartuAktivitas());
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
        untuk_kata: untukKata || undefined,
      };
      await simpanKartuBenda(kartu);
      // Kartu baru yang terhubung ke kata target langsung dipakai; kartu lama tetap tersimpan dan bisa dipilih lagi.
      if (untukKata) pakaiKartuBenda(kartu);
      if (aktivitas) pakaiDiAktivitas(aktivitas, kartu.id);
      setDipakai(kartuDipakai());
      setDiAktivitas(kartuAktivitas());
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
    setDiAktivitas(kartuAktivitas());
    if (buka?.id === id) setBuka(null);
    await muat();
  }

  if (buka) {
    const kata = kataKartu(buka);
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
            <h2 className={g.labelSeksi}>Otomatis tampil di aktivitas dengan kata</h2>
            <PilihKata kata={kataTarget} nilai={terhubung(buka) ? kata : ""} ubah={(k) => hubungkan(buka, k)} />
          </section>

          {galat ? <p className={g.kotakGalat}>{galat}</p> : null}
          {aktivitasHariIni.length > 0 ? (
            <section className="space-y-2">
              <h2 className={g.labelSeksi}>Tampilkan di aktivitas</h2>
              <ul className={g.daftar}>
                {aktivitasHariIni.map((a) => {
                  const tampil = tampilDi(buka).some((x) => x.item_id === a.item_id);
                  return (
                    <li key={a.item_id}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={tampil}
                        onClick={() => aturAktivitas(buka, a.item_id, !tampil)}
                        className={`${g.barisDaftar} tekan w-full text-left`}
                      >
                        <span
                          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            tampil ? "bg-hijau text-white" : "bg-permukaan ring-1 ring-garis"
                          }`}
                        >
                          {tampil ? <Ikon nama="centang" ukuran={16} /> : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[16px] font-semibold">{a.judul}</span>
                          <span className="block text-[13px] text-abu">
                            {a.rutinitas} · {a.kata_target.join(", ")}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="px-1 text-[13px] text-abu">Setiap aktivitas menampilkan satu foto. Mencentang di sini mengganti foto aktivitas itu.</p>
            </section>
          ) : null}
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
        <KepalaHijau
          kembali={aktivitas ? `/aktivitas/${encodeURIComponent(aktivitas)}` : "/hari-ini"}
          atas={aktivitas ? "Foto untuk aktivitas" : "Kartu foto benda"}
          judul={aktivitas ? judulAktivitas : "Benda kesukaan anak"}
          rapat
        >
          <p className="text-[16px] text-teks-di-hijau">
            {aktivitas ? "Pilih foto yang tampil di aktivitas ini, atau ambil foto baru." : "Foto ini hanya tersimpan di HP ini."}
          </p>
        </KepalaHijau>

        {aktivitas && fotoAktivitas ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-oranye-muda px-4 py-3">
            <span className="text-[15px] text-oranye-tua">
              Sekarang tampil: <b>{fotoAktivitas.kata}</b>
            </span>
            <button type="button" onClick={() => pakaiAktivitas("")} className={`${g.tombolTeks} px-2 text-[14px] text-oranye-tua`}>
              Lepas dari aktivitas
            </button>
          </div>
        ) : null}

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
                {untukKata ? `Foto akan muncul di kartu aktivitas "${untukKata}".` : "Pilih kata target agar fotonya muncul di kartu aktivitas."}
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
                const di = tampilDi(k);
                const aktif = aktivitas ? fotoAktivitas?.id === k.id : di.length > 0;
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
                        {di.length ? `Tampil di: ${di.map((a) => a.rutinitas).join(", ")}` : "Belum tampil di aktivitas"}
                      </span>
                    </button>
                    <div className="flex items-center justify-between px-1">
                      {aktivitas ? (
                        aktif ? (
                          <button type="button" onClick={() => pakaiAktivitas("")} className={`${g.tombolTeks} px-2 text-[14px] text-abu`}>
                            Lepas
                          </button>
                        ) : (
                          <button type="button" onClick={() => pakaiAktivitas(k.id)} className={`${g.tombolTeks} px-2 text-[14px]`}>
                            Pakai di sini
                          </button>
                        )
                      ) : (
                        <button type="button" onClick={() => setBuka(k)} className={`${g.tombolTeks} px-2 text-[14px]`}>
                          Pilih aktivitas
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
