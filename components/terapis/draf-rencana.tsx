"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API, type ResponseDari, type RequestDari } from "@/lib/kontrak/api";
import {
  panggil,
  pesanDari,
  PAKAI_CONTOH,
  GalatApi,
} from "@/lib/perangkat/panggil";
import * as g from "@/lib/gaya";

type Draf = NonNullable<ResponseDari<"setelahSesiLihat">["draf"]>;
export function DrafRencana({
  draf,
  bank,
  disetujui,
}: {
  draf: Draf;
  bank: ResponseDari<"aktivitasBank">;
  disetujui: (hasil: ResponseDari<"rencanaSetujui">) => void;
}) {
  const router = useRouter();
  const [isi, setIsi] = useState<RequestDari<"rencanaSetujui">["isi"]>(
    draf.isi,
  );
  const [target, setTarget] = useState(draf.isi.kata_target?.join(", ") ?? "");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");
  async function setujui() {
    setSibuk(true);
    setGalat("");
    try {
      const hasil = await panggil(API.rencanaSetujui, {
        drafId: draf.id,
        isi: {
          ...isi,
          ...(target.trim()
            ? {
                kata_target: target
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              }
            : {}),
        },
        mulai_sekarang: false,
      });
      disetujui(hasil);
    } catch (error) {
      if (error instanceof GalatApi && error.status === 401)
        router.replace("/terapis/masuk");
      setGalat(pesanDari(error));
    } finally {
      setSibuk(false);
    }
  }
  if (draf.status !== "aktif")
    return (
      <p className={g.kartu}>
        Draf ini sudah {draf.status}; muat ulang sebelum menyusun rencana
        berikutnya.
      </p>
    );
  return (
    <section className="grid gap-4 md:grid-cols-[2fr_1fr]">
      <div className={`${g.kartu} space-y-4`}>
        <h2 className="text-xl font-semibold">
          Draf rencana ·{" "}
          {draf.sumber === "ai" ? "disusun AI" : "templat cadangan"}
        </h2>
        <p className="text-sm text-abu">
          Belum dikirim. Periksa dan sunting sebelum menyetujui.
        </p>
        {isi.item.map((item, i) => (
          <label key={i} className="block space-y-2">
            <span>
              Aktivitas {i + 1} ·{" "}
              {item.anggota_id ? "anggota yang ditetapkan" : "semua anggota"}
            </span>
            <select
              className={g.isian}
              value={item.aktivitas_id}
              onChange={(e) =>
                setIsi((lama) => ({
                  ...lama,
                  item: lama.item.map((p, n) =>
                    n === i ? { ...p, aktivitas_id: e.target.value } : p,
                  ),
                }))
              }
            >
              {bank.aktivitas.map((a) => (
                <option value={a.id} key={a.id}>
                  {a.judul}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className="block space-y-2">
          <span>Pesan untuk keluarga</span>
          <textarea
            rows={4}
            maxLength={500}
            className={g.isian}
            value={isi.pesan_keluarga}
            onChange={(e) => setIsi({ ...isi, pesan_keluarga: e.target.value })}
          />
        </label>
        <label className="block space-y-2">
          <span>Lima kata target (opsional), dipisahkan koma</span>
          <input
            className={g.isian}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </label>
        {galat && (
          <p role="alert" className={g.kotakGalat}>
            {galat}
          </p>
        )}
        {PAKAI_CONTOH && (
          <p className={g.kotakGalat}>
            Data contoh; pengiriman ke keluarga tidak nyata.
          </p>
        )}
        <button className={g.tombolUtama} onClick={setujui} disabled={sibuk}>
          {sibuk ? "Menyetujui…" : "Setujui dan kirim"}
        </button>
      </div>
      <aside className={`${g.kartu} space-y-3`}>
        <h3 className="font-semibold">Dasar penyusunan</h3>
        {draf.dasar.map((d, i) => (
          <p key={i} className="text-sm text-abu">
            {bank.aktivitas.find((a) => a.id === d.aktivitas_id)?.judul ??
              d.aktivitas_id}
            : {d.alasan}
          </p>
        ))}
      </aside>
    </section>
  );
}
