"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { API } from "@/lib/kontrak/api";
import { useData } from "@/lib/perangkat/use-data";
import { panggil, pesanDari, PAKAI_CONTOH, GalatApi } from "@/lib/perangkat/panggil";
import { Memuat } from "@/components/memuat";
import { Gelembung } from "@/components/gelembung";
import * as g from "@/lib/gaya";

export function PesanKeluarga() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pesan = useData(API.anakPesanLihat, { id }, { masuk: "/terapis/masuk" });
  const [isi, setIsi] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");
  const akhir = useRef<HTMLDivElement>(null);
  useEffect(() => { akhir.current?.scrollIntoView({ block: "nearest" }); }, [pesan.data?.pesan.length]);
  async function kirim(event: FormEvent) {
    event.preventDefault(); if (!isi.trim() || !pesan.data) return; setSibuk(true); setGalat("");
    try {
      const baru = await panggil(API.anakPesanKirim, { id, isi: isi.trim() });
      pesan.setData({ pesan: [...pesan.data.pesan, baru] }); setIsi("");
    } catch (error) { if (error instanceof GalatApi && error.status === 401) router.replace("/terapis/masuk"); setGalat(pesanDari(error)); }
    finally { setSibuk(false); }
  }
  if (pesan.galat) return <p role="alert" className={g.kotakGalat}>{pesan.galat}</p>;
  if (!pesan.data) return <Memuat />;
  return <section className="space-y-5"><h1 className={g.judulHalaman}>Pesan keluarga</h1>{PAKAI_CONTOH && <p className={g.kotakGalat}>Data contoh · pesan tidak dikirim ke keluarga nyata.</p>}<div className="max-h-[60vh] space-y-4 overflow-y-auto rounded-2xl bg-background p-2" role="log" aria-label="Percakapan keluarga">{pesan.data.pesan.map((p, i) => <Gelembung key={`${p.id}-${i}`} milikSendiri={p.dari === "terapis"} nama={p.nama} waktu={new Date(p.dibuat).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} konteks={p.konteks}>{p.isi}</Gelembung>)}{!pesan.data.pesan.length && <p className={g.kartu}>Belum ada pesan keluarga.</p>}<div ref={akhir} /></div><form onSubmit={kirim} className="space-y-3"><label className="block space-y-2"><span>Balasan terapis</span><textarea className={g.isian} rows={3} maxLength={1000} value={isi} onChange={(e) => setIsi(e.target.value)} /></label>{galat && <p role="alert" className={g.kotakGalat}>{galat}</p>}<button className={g.tombolUtama} disabled={sibuk || !isi.trim()}>{sibuk ? "Mengirim…" : "Kirim balasan"}</button></form></section>;
}
