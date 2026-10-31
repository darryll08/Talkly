"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { API, type Peran, type ResponseDari } from "@/lib/kontrak/api";
import {
  panggil,
  pesanDari,
  PAKAI_CONTOH,
  GalatApi,
} from "@/lib/perangkat/panggil";
import { useData } from "@/lib/perangkat/use-data";
import { KodeQr } from "@/components/kode-qr";
import { Pil } from "@/components/pil";
import { Memuat } from "@/components/memuat";
import * as g from "@/lib/gaya";

export function UndanganKeluarga() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const daftar = useData(API.anakUndangan, { id }, { masuk: "/terapis/masuk" });
  const { muatUlang } = daftar;
  const [peran, setPeran] = useState<Peran>("ibu");
  const [hasil, setHasil] = useState<ResponseDari<"undanganBuat"> | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");
  const [pesan, setPesan] = useState("");
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") muatUlang();
    }, 5000);
    return () => clearInterval(timer);
  }, [muatUlang]);
  async function buat() {
    setSibuk(true);
    setGalat("");
    setPesan("");
    setHasil(null);
    try {
      setHasil(await panggil(API.undanganBuat, { anak_id: id, peran }));
      daftar.muatUlang();
    } catch (error) {
      if (error instanceof GalatApi && error.status === 401)
        router.replace("/terapis/masuk");
      setGalat(pesanDari(error));
    } finally {
      setSibuk(false);
    }
  }
  async function salin() {
    if (!hasil) return;
    try {
      await navigator.clipboard.writeText(hasil.tautan);
      setPesan("Tautan disalin.");
    } catch {
      setGalat(
        "Tautan belum bisa disalin otomatis. Pilih tautan di bawah dan salin secara manual.",
      );
    }
  }
  return (
    <section className="space-y-6">
      <h1 className={g.judulHalaman}>Undang keluarga</h1>
      {PAKAI_CONTOH && (
        <p className={g.kotakGalat}>
          Data contoh · QR ini bukan bukti undangan nyata sudah tersimpan.
        </p>
      )}
      <Pil
        label="Peran anggota keluarga"
        nama="peran"
        nilai={peran}
        ubah={setPeran}
        pilihan={(
          ["ibu", "ayah", "pengasuh", "nenek", "kakek", "lainnya"] as const
        ).map((p) => ({
          nilai: p,
          label: p.charAt(0).toUpperCase() + p.slice(1),
        }))}
      />
      <button className={g.tombolUtama} disabled={sibuk} onClick={buat}>
        {sibuk ? "Membuat…" : "Buat undangan"}
      </button>
      {(galat || daftar.galat) && (
        <div role="alert" className={g.kotakGalat}>
          <p>{galat || daftar.galat}</p>
          <Link className={g.tombolTeks} href={`/terapis/anak/${id}/program`}>
            Periksa status pendengaran dan program
          </Link>
        </div>
      )}
      {pesan && <p role="status">{pesan}</p>}
      {hasil && (
        <div className={`${g.kartu} flex flex-col items-center gap-4`}>
          <KodeQr
            teks={hasil.tautan}
            ukuran={240}
            label="QR undangan keluarga"
          />
          <p className="break-all font-mono text-2xl font-semibold">
            {hasil.kode}
          </p>
          <p className="text-sm text-abu">
            Berlaku sampai{" "}
            {new Date(hasil.kedaluwarsa).toLocaleString("id-ID", {
              timeZone: "Asia/Jakarta",
            })}
          </p>
          <p className="w-full break-all text-sm">{hasil.tautan}</p>
          <button className={g.tombolKedua} onClick={salin}>
            Salin tautan
          </button>
        </div>
      )}
      <h2 className={g.labelSeksi}>Daftar undangan</h2>
      {!daftar.data && !daftar.galat ? (
        <Memuat />
      ) : (
        <ul className={g.daftar}>
          {daftar.data?.undangan.map((u) => (
            <li
              key={u.id}
              className={`${g.barisDaftar} flex-wrap justify-between`}
            >
              <span>{u.peran}</span>
              <span>
                {u.status}
                {u.dipakai_oleh ? ` oleh ${u.dipakai_oleh}` : ""}
              </span>
              <time className="text-sm text-abu">
                {new Date(u.kedaluwarsa).toLocaleDateString("id-ID", {
                  timeZone: "Asia/Jakarta",
                })}
              </time>
            </li>
          ))}
        </ul>
      )}
      {daftar.data?.undangan.length === 0 && (
        <p className={g.kartu}>Belum ada undangan.</p>
      )}
    </section>
  );
}
