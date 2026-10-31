"use client";

import { useParams } from "next/navigation";
import { API, type ResponseDari } from "@/lib/kontrak/api";
import { useData } from "@/lib/perangkat/use-data";
import { Memuat } from "@/components/memuat";
import { Inisial } from "@/components/inisial";
import { StatusAnak } from "@/components/terapis/status-anak";
import { PitaPercakapan } from "@/components/terapis/pita-percakapan";
import * as g from "@/lib/gaya";

type Rentang = ResponseDari<"anakKartu">["strategi"]["jeda_rata_s"];
const nombre = (n: number | null) => n === null ? "—" : new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(n);
function Ukuran({ judul, nilai, unit }: { judul: string; nilai: Rentang; unit: string }) {
  return <div className={g.kartu}><p className="text-sm text-abu">{judul}</p><p className={`my-2 text-3xl text-hijau-tua ${g.angkaBesar}`}>{nombre(nilai.nilai)} <span className="text-sm font-normal">{unit}</span></p><p className="text-xs text-abu">Rentang {nombre(nilai.bawah)}–{nombre(nilai.atas)} {unit}</p></div>;
}
export function KartuAnak() {
  const { id } = useParams<{ id: string }>();
  const { data, galat, status, muatUlang } = useData(API.anakKartu, { id }, { masuk: "/terapis/masuk" });
  if (galat) return <div role="alert" className={g.kotakGalat}><p>{status === 403 ? "Anak ini tidak ditangani oleh Anda." : galat}</p><button className={g.tombolTeks} onClick={muatUlang}>Coba lagi</button></div>;
  if (!data) return <Memuat label="Memuat kartu anak" />;
  if (data.anak.id !== id) return <p className={g.kotakGalat}>Kartu anak ini belum tersedia pada penyedia data. Data anak lain tidak ditampilkan.</p>;
  return (
    <article className="muncul space-y-7">
      <header className="flex flex-wrap items-center gap-4"><Inisial nama={data.anak.nama} ukuran={56} /><div className="min-w-0 flex-1"><p className={g.labelAtas}>Kartu anak · persiapan sesi</p><h1 className={`${g.judulHalaman} break-words`}>{data.anak.nama}</h1><p className="text-sm text-abu">{data.anak.usia_bulan} bulan · Tahap {data.anak.tahap}</p></div><StatusAnak status={data.anak.status} pemicu={data.anak.pemicu} /></header>
      {data.anak.data_contoh && <p className="text-sm text-abu">Data contoh · bukan hasil pengguna atau uji akurasi</p>}
      <section className="space-y-3"><h2 className={g.labelSeksi}>Strategi dari rekaman · 14 hari</h2>{data.strategi.data_cukup ? <div className="grid gap-3 sm:grid-cols-3"><Ukuran judul="Jeda menunggu" nilai={data.strategi.jeda_rata_s} unit="detik" /><Ukuran judul="Ajakan berhasil" nilai={data.strategi.ajakan_berhasil_persen} unit="%" /><Ukuran judul="Giliran percakapan" nilai={data.strategi.giliran_per_menit} unit="/menit" /></div> : <p className={g.kartu}>Angka lengkap muncul setelah ada sedikitnya 3 rekaman dan 30 ajakan dalam 14 hari.</p>}</section>
      {data.strategi.data_cukup && data.tren.length > 0 && <section className={`${g.kartu} space-y-3`}><h2 className={g.labelSeksi}>Tren mingguan · data terukur</h2><ul className="divide-y divide-garis">{data.tren.map((t) => <li key={t.minggu_mulai} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><time>{t.minggu_mulai}</time><span className="text-hijau-tua">Jeda {nombre(t.jeda_rata_s)} dtk · giliran {nombre(t.giliran_per_menit)}/menit</span><span className="text-abu">{t.vokalisasi_per_minggu} vokalisasi · {t.rekaman} rekaman</span></li>)}</ul></section>}
      <section className={`${g.kartu} space-y-3`}><h2 className={g.labelSeksi}>Percakapan terpilih</h2>{data.rekaman_terpilih ? <><p className="text-sm text-abu">{data.rekaman_terpilih.perekam} · {data.rekaman_terpilih.durasi_s} detik</p><PitaPercakapan rekaman={data.rekaman_terpilih} /></> : <p className="text-abu">Belum ada rekaman yang dapat ditampilkan.</p>}</section>
      <section className="space-y-3"><h2 className={g.labelSeksi}>Per pengasuh</h2><ul className={g.daftar}>{data.per_pengasuh.map((p) => <li key={p.anggota_id} className={`${g.barisDaftar} flex-wrap`}><Inisial nama={p.nama} /><div className="min-w-0 flex-1"><p className="font-semibold">{p.nama}</p><p className="text-sm text-abu">{p.rekaman} rekaman · aktif {p.hari_aktif_7}/7</p></div><p className="text-sm text-hijau-tua">{p.jeda_rata_s === null || p.giliran_per_menit === null ? "Data belum cukup" : `Jeda ${nombre(p.jeda_rata_s)} dtk · ${nombre(p.giliran_per_menit)} giliran/menit`}</p></li>)}</ul></section>
      <section className="space-y-4 rounded-2xl border border-oranye/20 bg-oranye-muda p-4 text-oranye-tua"><h2 className="font-semibold">Dilaporkan keluarga</h2><p className="text-sm">Catatan ini terpisah dari pengukuran rekaman.</p>{data.laporan_keluarga.length ? data.laporan_keluarga.map((l) => <div key={l.id} className="border-t border-oranye/20 pt-3"><p className="text-sm font-semibold">{l.nama} · {l.tanggal}</p><p className="mt-1 whitespace-pre-wrap break-words">{l.laporan.jenis === "catatan_malam" ? l.laporan.isi.catatan : l.laporan.isi.cerita}</p>{l.laporan.jenis === "catatan_malam" && <p className="mt-1 text-sm">Kondisi: {l.laporan.isi.kondisi.replaceAll("_", " ")}</p>}</div>) : <p>Belum ada laporan keluarga.</p>}<div><h3 className="text-sm font-semibold">Kata dilaporkan · belum dikonfirmasi terapis</h3><p>{data.kata_dilaporkan.map((k) => k.kata).join(", ") || "Belum ada kata dilaporkan."}</p></div>{data.kutipan_regresi.map((k, i) => <blockquote key={i} className="border-l-2 border-oranye pl-3">“{k.kutipan}”<footer className="text-sm">{k.nama} · {k.tanggal}</footer></blockquote>)}</section>
      <section className={`${g.kartu} space-y-3`}><h2 className={g.labelSeksi}>Saran sesi dari aturan</h2>{data.saran_sesi.length ? <ul className="list-inside list-disc space-y-2">{data.saran_sesi.map((s) => <li key={s}>{s}</li>)}</ul> : <p className="text-abu">Belum ada saran sesi.</p>}</section>
      <section className="space-y-3"><h2 className={g.labelSeksi}>Rekaman terbaru</h2><ul className={g.daftar}>{data.rekaman_terbaru.map((r) => <li key={r.id} className={`${g.barisDaftar} flex-wrap justify-between text-sm`}><div><p className="font-semibold">{r.perekam}</p><time className="text-abu">{new Date(r.dibuat).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</time></div><span>{r.status}</span></li>)}</ul>{!data.rekaman_terbaru.length && <p className={g.kartu}>Belum ada rekaman.</p>}</section>
    </article>
  );
}
