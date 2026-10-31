// Uji alur rekaman ujung ke ujung terhadap server lokal dan TALKLY-DEV (bukan produksi).
//   npx next dev -p 3100   (terminal lain)
//   node --env-file=.env.local node_modules/tsx/dist/cli.mjs uji/alur-rekaman.ts http://localhost:3100 [berkas.webm]
// 1) transkrip tiruan → prosesRekaman (ukur + GPT-6 Luna sungguhan + simpan), tanpa kredit STT
// 2) unggah audio lewat HTTP → 202 → Scribe → ditolak (pendek) → audio dihapus
// 3) id_lokal ganda, perekam tanpa izin (422), keluarga lain (404)

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { API } from "../lib/kontrak/api";
import { ID_CONTOH } from "../lib/server/data-contoh";
import { prosesRekaman } from "../lib/ukur/proses";
import { pengisi, transkrip } from "./data/bantu-transkrip";

const URL_DASAR = process.argv[2] ?? "http://localhost:3100";
const BERKAS = process.argv[3];
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
if (new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.startsWith(process.env.PROYEK_PRODUKSI ?? "faknolzliaexcushiflm")) {
  throw new Error("Jangan jalankan uji alur ke database produksi.");
}

let gagal = 0;
const cek = (ok: boolean, teks: string) => {
  console.log(`${ok ? "  ok   " : "  GAGAL"} ${teks}`);
  if (!ok) gagal++;
};

async function masuk(sebagai: string) {
  const res = await fetch(`${URL_DASAR}/api/demo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sebagai }) });
  return res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}

async function lihat(cookie: string, id: string) {
  const res = await fetch(`${URL_DASAR}/api/rekaman/${id}`, { headers: { cookie } });
  return { status: res.status, json: res.status === 200 ? await res.json() : null };
}

async function utama() {
  // 1. Transkrip tiruan seperti naskah N02: jeda 4,8 detik, anak bersuara, ibu memperluas.
  console.log("1. Transkrip tiruan → prosesRekaman");
  const t = transkrip([
    ["ibu", 1, 2.5, "Raka lihat ini bebek"],
    ["ibu", 3, 4, "bebek?"],
    ["anak", 8.8, 9.3, "bek"],
    ["ibu", 10, 11.5, "iya bebek mandi"],
    ["ibu", 13, 14, "mau lagi?"],
    ["anak", 18.5, 18.9, "agi"],
    ["ibu", 19.5, 21, "lagi bebek lagi"],
    ...pengisi(24, 58),
  ]);
  const id = crypto.randomUUID();
  const { error } = await db.from("rekaman").insert({
    id,
    id_lokal: `uji-${id}`,
    anggota_id: ID_CONTOH.ibuSari,
    anak_id: ID_CONTOH.raka,
    durasi_s: 60,
    meta: { id_lokal: `uji-${id}`, perekam_id: ID_CONTOH.ibuSari, durasi_s: 60, terputus: false, transkrip: t },
  });
  cek(!error, `rekaman uji dibuat ${error?.message ?? ""}`);
  const mulai = Date.now();
  await prosesRekaman(id);
  const ibu = await masuk("ibu_sari");
  const r1 = await lihat(ibu, id);
  cek(r1.status === 200 && r1.json.status === "dinilai", `status dinilai (${((Date.now() - mulai) / 1000).toFixed(1)} detik)`);
  const kontrak = API.rekamanLihat.response.safeParse(r1.json);
  cek(kontrak.success, "balasan GET /api/rekaman/:id lolos kontrak");
  const h = r1.json?.hasil;
  cek(h?.ukuran?.giliran === 2, `giliran = ${h?.ukuran?.giliran} (harap 2)`);
  cek(h?.ajakan?.find((a: { teks: string }) => a.teks.endsWith("bebek?"))?.jeda_s === 4.8, "jeda ajakan 'bebek?' = 4,8 detik");
  console.log(`       sumber umpan balik: ${h?.umpan_balik?.sumber}; pujian ${h?.umpan_balik?.pujian_id}: ${h?.umpan_balik?.teks_pujian}`);
  console.log(`       saran ${h?.umpan_balik?.saran_id}: ${h?.umpan_balik?.teks_saran}`);
  console.log(`       versi anak: ${h?.umpan_balik?.versi_anak}; momen: ${JSON.stringify(h?.umpan_balik?.momen)}`);

  // 2. Unggah audio sungguhan lewat HTTP.
  console.log("2. Unggah audio lewat HTTP");
  if (!BERKAS) {
    console.log("  lewati (berkas audio tidak diberikan)");
  } else {
    const idLokal = `uji-${crypto.randomUUID()}`;
    const kirim = async (meta: object) => {
      const form = new FormData();
      form.append("audio", new Blob([readFileSync(BERKAS)], { type: "audio/webm" }), "uji.webm");
      form.append("meta", JSON.stringify(meta));
      return fetch(`${URL_DASAR}/api/rekaman`, { method: "POST", headers: { cookie: ibu }, body: form });
    };
    const meta = { id_lokal: idLokal, perekam_id: ID_CONTOH.ibuSari, durasi_s: 3, terputus: false, mulai_menunggu_s: [] };
    const res = await kirim(meta);
    const { rekaman_id } = await res.json();
    cek(res.status === 202 && !!rekaman_id, `unggah 202 (${res.status})`);
    const ulang = await kirim(meta);
    cek(ulang.status === 202 && (await ulang.json()).rekaman_id === rekaman_id, "id_lokal sama → rekaman_id sama");

    let akhir = null;
    for (let i = 0; i < 40; i++) {
      const r = await lihat(ibu, rekaman_id);
      if (r.json?.status !== "antre") {
        akhir = r.json;
        break;
      }
      await new Promise((ok) => setTimeout(ok, 1500));
    }
    cek(akhir?.status === "ditolak", `rekaman pendek ditolak: ${akhir?.alasan_tolak}`);
    console.log(`       penyedia STT: ${akhir?.hasil?.stt?.penyedia} (berkas palsu → tidak_ada, jalur K11)`);
    const { data: baris } = await db.from("rekaman").select("path_audio").eq("id", rekaman_id).single();
    cek(baris?.path_audio === null, "audio rekaman ditolak sudah dihapus");

    await db.from("anggota").update({ izin_nilai: false }).eq("id", ID_CONTOH.mbakSri);
    const tanpaIzin = await kirim({ ...meta, id_lokal: `uji-${crypto.randomUUID()}`, perekam_id: ID_CONTOH.mbakSri });
    await db.from("anggota").update({ izin_nilai: true }).eq("id", ID_CONTOH.mbakSri);
    cek(tanpaIzin.status === 422, `perekam tanpa izin nilai → 422 (${tanpaIzin.status})`);
  }

  // 3. Akses lintas keluarga.
  console.log("3. Akses");
  const ujiB = await masuk("uji_b");
  cek((await lihat(ujiB, id)).status === 404, "keluarga lain membuka rekaman Raka → 404");
  cek((await lihat("", id)).status === 401, "tanpa cookie → 401");

  await db.from("rekaman").delete().like("id_lokal", "uji-%");
  console.log(gagal ? `${gagal} cek gagal.` : "Semua lolos.");
  process.exit(gagal ? 1 : 0);
}

utama();
