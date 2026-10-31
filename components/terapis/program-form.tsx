"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { API, type RequestDari, type ResponseDari } from "@/lib/kontrak/api";
import {
  panggil,
  pesanDari,
  PAKAI_CONTOH,
  GalatApi,
} from "@/lib/perangkat/panggil";
import { Pil } from "@/components/pil";
import { Sakelar } from "@/components/sakelar";
import * as g from "@/lib/gaya";

type Props = {
  anak?: ResponseDari<"anakLihat">;
  bank: ResponseDari<"aktivitasBank">;
};
export function ProgramForm({ anak, bank }: Props) {
  const router = useRouter();
  const [nilai, setNilai] = useState<RequestDari<"anakBuat">>(
    anak ?? {
      nama: "",
      tanggal_lahir: "",
      pendengaran: null,
      tahap: 1,
      strategi_fokus: "",
      kata_target: [],
      aktivitas_id: [],
      hari_sesi: 1,
      jam_sesi: "09:00",
      ukuran_nonaktif: [],
      minat: "",
      rutinitas: "",
    },
  );
  const [kata, setKata] = useState(anak?.kata_target.join(", ") ?? "");
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState("");
  function ubah<K extends keyof typeof nilai>(k: K, v: (typeof nilai)[K]) {
    setNilai((lama) => ({ ...lama, [k]: v }));
  }
  async function simpan(event: FormEvent) {
    event.preventDefault();
    setPesan("");
    const hasil = API.anakBuat.request.safeParse({
      ...nilai,
      kata_target: kata
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    if (!hasil.success) {
      const daftar: Record<string, string> = {};
      hasil.error.issues.forEach((i) => {
        daftar[String(i.path[0])] = i.message;
      });
      setGalat(daftar);
      return;
    }
    setGalat({});
    setSibuk(true);
    try {
      const hasilSimpan = anak
        ? await panggil(API.anakUbah, { ...hasil.data, id: anak.id })
        : await panggil(API.anakBuat, hasil.data);
      if (PAKAI_CONTOH)
        setPesan(
          "Respons data contoh diterima. Perubahan ini belum disimpan ke database nyata.",
        );
      else if (!anak) router.push(`/terapis/anak/${hasilSimpan.id}/undangan`);
      else setPesan("Program tersimpan.");
    } catch (error) {
      if (error instanceof GalatApi && error.status === 401)
        router.replace("/terapis/masuk");
      setGalat({ formulir: pesanDari(error) });
    } finally {
      setSibuk(false);
    }
  }
  const kolom = (
    k: "nama" | "tanggal_lahir" | "strategi_fokus" | "jam_sesi",
    label: string,
    type = "text",
  ) => (
    <label className="block space-y-2">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        className={g.isian}
        value={nilai[k]}
        onChange={(e) => ubah(k, e.target.value)}
        required
        aria-invalid={Boolean(galat[k])}
      />
      {galat[k] && <span className="text-sm text-oranye-tua">{galat[k]}</span>}
    </label>
  );
  return (
    <form onSubmit={simpan} className="space-y-6">
      {PAKAI_CONTOH && (
        <p className={g.kotakGalat}>
          Data contoh · penyimpanan ke database belum diuji.
        </p>
      )}
      {kolom("nama", "Nama anak")}
      {kolom("tanggal_lahir", "Tanggal lahir", "date")}
      <label className="block space-y-2">
        <span className="font-medium">Status pendengaran</span>
        <select
          className={g.isian}
          value={nilai.pendengaran ?? ""}
          onChange={(e) =>
            ubah(
              "pendengaran",
              (e.target.value || null) as typeof nilai.pendengaran,
            )
          }
        >
          <option value="">Belum diisi</option>
          <option value="normal">Normal</option>
          <option value="belum_diperiksa">Belum diperiksa</option>
          <option value="gangguan">Gangguan pendengaran</option>
        </select>
        <span className="text-sm text-abu">
          Status ini wajib diisi sebelum membuat undangan keluarga.
        </span>
      </label>
      <Pil
        nama="tahap"
        label="Tahap bahasa"
        nilai={String(nilai.tahap)}
        pilihan={[1, 2, 3, 4].map((n) => ({
          nilai: String(n),
          label: `Tahap ${n}`,
        }))}
        ubah={(v) => {
          ubah("tahap", Number(v));
          ubah("aktivitas_id", []);
        }}
      />
      {kolom("strategi_fokus", "Strategi fokus")}
      <label className="block space-y-2">
        <span className="font-medium">Lima kata target, dipisahkan koma</span>
        <input
          className={g.isian}
          value={kata}
          onChange={(e) => setKata(e.target.value)}
          aria-invalid={Boolean(galat.kata_target)}
        />
        {galat.kata_target && (
          <span className="text-sm text-oranye-tua">
            Isi tepat lima kata target.
          </span>
        )}
      </label>
      <div className="flex flex-wrap gap-2">
        {kata
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s, i) => (
            <button
              key={`${i}-${s}`}
              type="button"
              className={g.labelKata}
              aria-label={`Hapus kata ${s}`}
              onClick={() =>
                setKata(
                  kata
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .filter((_, j) => i !== j)
                    .join(","),
                )
              }
            >
              {s} ×
            </button>
          ))}
      </div>
      <fieldset className={`${g.kartu} space-y-3`}>
        {/* float + w-full: legend tetap di dalam kartu, tidak menimpa tepi atas fieldset. */}
        <legend className="float-left mb-1 w-full font-semibold">Aktivitas tahap {nilai.tahap}</legend>
        <div className="clear-left" />
        {bank.aktivitas
          .filter((a) => a.tahap === nilai.tahap)
          .map((a) => (
            <label key={a.id} className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={nilai.aktivitas_id.includes(a.id)}
                onChange={(e) =>
                  ubah(
                    "aktivitas_id",
                    e.target.checked
                      ? [...nilai.aktivitas_id, a.id]
                      : nilai.aktivitas_id.filter((n) => n !== a.id),
                  )
                }
              />
              <span>
                {a.judul}
                <span className="block text-sm text-abu">{a.rutinitas}</span>
              </span>
            </label>
          ))}
        {!bank.aktivitas.some((a) => a.tahap === nilai.tahap) && (
          <p className="text-abu">Bank aktivitas tahap ini belum tersedia.</p>
        )}
        {galat.aktivitas_id && (
          <p className="text-sm text-oranye-tua">
            Pilih setidaknya satu aktivitas.
          </p>
        )}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span>Hari sesi</span>
          <select
            className={g.isian}
            value={nilai.hari_sesi}
            onChange={(e) => ubah("hari_sesi", Number(e.target.value))}
          >
            {[
              "Senin",
              "Selasa",
              "Rabu",
              "Kamis",
              "Jumat",
              "Sabtu",
              "Minggu",
            ].map((h, i) => (
              <option key={h} value={i + 1}>
                {h}
              </option>
            ))}
          </select>
        </label>
        {kolom("jam_sesi", "Jam sesi", "time")}
      </div>
      <div className={g.kartu}>
        <Sakelar
          label="Nonaktifkan ukuran suruhan beruntun"
          nyala={nilai.ukuran_nonaktif?.includes("suruhan_beruntun") ?? false}
          ubah={(nyala) =>
            ubah("ukuran_nonaktif", nyala ? ["suruhan_beruntun"] : [])
          }
        />
      </div>
      {galat.formulir && (
        <p role="alert" className={g.kotakGalat}>
          {galat.formulir}
        </p>
      )}
      {pesan && (
        <p role="status" className={g.kartu}>
          {pesan}
        </p>
      )}
      <button disabled={sibuk} className={g.tombolUtama}>
        {sibuk ? "Menyimpan…" : "Simpan program"}
      </button>
    </form>
  );
}
