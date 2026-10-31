"use client";
import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { API, type RequestDari } from "@/lib/kontrak/api";
import {
  panggil,
  pesanDari,
  PAKAI_CONTOH,
  GalatApi,
} from "@/lib/perangkat/panggil";
import { useData } from "@/lib/perangkat/use-data";
import { Memuat } from "@/components/memuat";
import { DrafRencana } from "./draf-rencana";
import * as g from "@/lib/gaya";

export function SetelahSesi() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const sesi = useData(
    API.setelahSesiLihat,
    { anak: id },
    { masuk: "/terapis/masuk" },
  );
  const kartu = useData(API.anakKartu, { id }, { masuk: "/terapis/masuk" });
  const bank = useData(API.aktivitasBank, undefined, {
    masuk: "/terapis/masuk",
  });
  const [catatan, setCatatan] = useState("");
  const [kata, setKata] = useState<string[]>([]);
  const [tambahan, setTambahan] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");
  const [pesan, setPesan] = useState("");
  async function simpan(event: FormEvent) {
    event.preventDefault();
    setSibuk(true);
    setGalat("");
    setPesan("");
    const data: RequestDari<"setelahSesiSimpan"> = {
      anak_id: id,
      catatan: catatan.trim(),
      kata_baru_dikonfirmasi: [
        ...new Set([
          ...kata,
          ...tambahan
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        ]),
      ],
    };
    try {
      const hasil = await panggil(API.setelahSesiSimpan, data);
      sesi.setData({
        catatan: {
          id: hasil.catatan_id,
          tanggal: new Date().toISOString(),
          isi: data.catatan,
          kata_baru_dikonfirmasi: data.kata_baru_dikonfirmasi ?? [],
        },
        draf: hasil.draf,
      });
      setPesan(
        PAKAI_CONTOH
          ? "Respons data contoh diterima; catatan belum tersimpan ke database nyata."
          : hasil.draf
            ? "Catatan tersimpan. Tinjau draf sebelum mengirim."
            : "Catatan tersimpan. Draf belum tersedia; catatan tetap aman.",
      );
    } catch (error) {
      if (error instanceof GalatApi && error.status === 401)
        router.replace("/terapis/masuk");
      setGalat(pesanDari(error));
    } finally {
      setSibuk(false);
    }
  }
  const masalah = sesi.galat || kartu.galat || bank.galat;
  if (masalah)
    return (
      <p role="alert" className={g.kotakGalat}>
        {masalah}
      </p>
    );
  if (!sesi.data || !kartu.data || !bank.data) return <Memuat />;
  if (kartu.data.anak.id !== id)
    return (
      <p className={g.kotakGalat}>
        Data anak ini belum tersedia pada penyedia data.
      </p>
    );
  return (
    <section className="space-y-6">
      <h1 className={g.judulHalaman}>Setelah sesi</h1>
      {PAKAI_CONTOH && (
        <p className={g.kotakGalat}>
          Data contoh · penyimpanan dan pengiriman nyata belum diuji.
        </p>
      )}
      {sesi.data.catatan && (
        <div className={g.kartu}>
          <h2 className={g.labelSeksi}>Catatan terakhir</h2>
          <p className="mt-3 whitespace-pre-wrap break-words">
            {sesi.data.catatan.isi}
          </p>
        </div>
      )}
      <form onSubmit={simpan} className="space-y-5">
        <label className="block space-y-2">
          <span className="font-semibold">Catatan sesi baru</span>
          <textarea
            className={g.isian}
            rows={5}
            required
            maxLength={2000}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />
        </label>
        <fieldset className={`${g.kartu} space-y-3`}>
          <legend className="font-semibold">
            Kata yang terapis dengar dan konfirmasi
          </legend>
          {kartu.data.kata_dilaporkan.map((k) => (
            <label key={k.kata} className="flex gap-3">
              <input
                type="checkbox"
                checked={kata.includes(k.kata)}
                onChange={(e) =>
                  setKata((lama) =>
                    e.target.checked
                      ? [...lama, k.kata]
                      : lama.filter((s) => s !== k.kata),
                  )
                }
              />
              {k.kata}
            </label>
          ))}
          <label className="block space-y-2">
            <span>Kata tambahan, dipisahkan koma</span>
            <input
              className={g.isian}
              value={tambahan}
              onChange={(e) => setTambahan(e.target.value)}
            />
          </label>
        </fieldset>
        {galat && (
          <p role="alert" className={g.kotakGalat}>
            {galat}
          </p>
        )}
        {pesan && (
          <p role="status" className={g.kartu}>
            {pesan}
          </p>
        )}
        <button className={g.tombolUtama} disabled={sibuk || !catatan.trim()}>
          {sibuk ? "Menyimpan…" : "Simpan catatan"}
        </button>
      </form>
      {sesi.data.draf ? (
        <DrafRencana
          key={sesi.data.draf.id}
          draf={sesi.data.draf}
          bank={bank.data}
          disetujui={(hasil) => {
            sesi.setData({ ...sesi.data!, draf: null });
            setPesan(
              PAKAI_CONTOH
                ? "Persetujuan data contoh berhasil; tidak ada rencana dikirim ke keluarga nyata."
                : `Rencana disetujui untuk minggu mulai ${new Date(`${hasil.minggu_mulai}T12:00:00+07:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" })}.`,
            );
          }}
        />
      ) : (
        <p className={`${g.kartu} text-abu`}>
          Belum ada draf aktif. Rencana baru terkirim setelah ditinjau dan
          disetujui terapis.
        </p>
      )}
    </section>
  );
}
