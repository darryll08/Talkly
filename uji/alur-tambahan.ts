// Uji alur lapis Diutamakan terhadap server lokal dan TALKLY-DEV. Diakhiri dengan seed ulang.
//   node --env-file=.env.local node_modules/tsx/dist/cli.mjs uji/alur-tambahan.ts http://localhost:3100

import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { API } from "../lib/kontrak/api";
import { ID_CONTOH } from "../lib/server/data-contoh";

const U = process.argv[2] ?? "http://localhost:3100";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
if (new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.startsWith("faknolzliaexcushiflm")) throw new Error("Jangan uji ke produksi.");

let gagal = 0;
const cek = (ok: boolean, teks: string) => {
  console.log(`${ok ? "  ok   " : "  GAGAL"} ${teks}`);
  if (!ok) gagal++;
};
async function minta(metode: string, path: string, body?: unknown, cookie = "", header: Record<string, string> = {}) {
  const res = await fetch(`${U}${path}`, { method: metode, headers: { "Content-Type": "application/json", cookie, ...header }, body: body === undefined ? undefined : JSON.stringify(body) });
  const set = res.headers.getSetCookie().map((c) => c.split(";")[0]).filter((c) => !c.endsWith("="));
  const t = await res.text();
  return { status: res.status, json: t ? JSON.parse(t) : null, cookie: set.join("; ") };
}
const lolos = (nama: keyof typeof API, json: unknown) => {
  const e = API[nama];
  return "response" in e && e.response ? e.response.safeParse(json).success : false;
};

/** Rekaman dengan audio sungguhan di bucket untuk menguji izin dengar dan pemutaran terapis. */
async function rekamanBeraudio(anggotaId: string) {
  const id = crypto.randomUUID();
  const path = `${ID_CONTOH.raka}/${id}.webm`;
  await db.storage.from("audio").upload(path, new Blob([new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 1, 2, 3])], { type: "audio/webm" }), { contentType: "audio/webm" });
  await db.from("rekaman").insert({ id, id_lokal: `uji-${id}`, anggota_id: anggotaId, anak_id: ID_CONTOH.raka, path_audio: path, durasi_s: 50, status: "dinilai", meta: {}, audio_kedaluwarsa: new Date(Date.now() - 1000).toISOString() });
  return { id, path };
}

async function utama() {
  const ibu = (await minta("POST", "/api/demo", { sebagai: "ibu_sari" })).cookie;
  const sri = (await minta("POST", "/api/demo", { sebagai: "mbak_sri" })).cookie;
  const nadia = (await minta("POST", "/api/demo", { sebagai: "kak_nadia" })).cookie;

  console.log("Izin rekaman");
  const izin = await minta("GET", "/api/saya/izin", undefined, ibu);
  cek(lolos("izinLihat", izin.json) && izin.json.penjelasan.length === 3 && /Pasal 56/.test(izin.json.dasar_hukum), "tiga izin dengan penyedia, negara, dan dasar hukum");

  console.log("Audio terapis");
  const r1 = await rekamanBeraudio(ID_CONTOH.ibuSari);
  const sebelum = (await db.from("log_dengar").select("id", { count: "exact", head: true }).eq("rekaman_id", r1.id)).count ?? 0;
  const audio = await minta("GET", `/api/rekaman/${r1.id}/audio`, undefined, nadia);
  const sesudah = (await db.from("log_dengar").select("id", { count: "exact", head: true }).eq("rekaman_id", r1.id)).count ?? 0;
  cek(audio.status === 200 && lolos("rekamanAudio", audio.json) && audio.json.berlaku_s === 300, "tautan bertanda tangan 5 menit");
  cek(sesudah === sebelum + 1, "pemutaran tercatat di log_dengar");
  const r2 = await rekamanBeraudio(ID_CONTOH.mbakSri);
  cek((await minta("GET", `/api/rekaman/${r2.id}/audio`, undefined, nadia)).status === 403, "izin dengar perekam mati → 403");
  cek((await minta("GET", `/api/rekaman/${r1.id}/audio`, undefined, ibu)).status === 401, "keluarga tidak bisa meminta tautan audio → 401");

  console.log("Cron");
  cek((await minta("GET", "/api/cron/bersihkan-audio")).status === 401, "cron tanpa rahasia → 401");
  const rahasia = { authorization: `Bearer ${process.env.CRON_SECRET}` };
  const bersih = await minta("GET", "/api/cron/bersihkan-audio", undefined, "", rahasia);
  const { data: r1Baru } = await db.from("rekaman").select("path_audio").eq("id", r1.id).single();
  cek(bersih.status === 200 && bersih.json.dihapus >= 1 && r1Baru?.path_audio === null, `audio lewat 7 hari dihapus (${bersih.json?.dihapus})`);
  const ingat = await minta("GET", "/api/cron/pengingat", undefined, "", rahasia);
  cek(ingat.status === 200 && lolos("cronPengingat", ingat.json), `pengingat berjalan (${JSON.stringify(ingat.json)})`);

  console.log("Matikan izin dengar menghapus audio");
  await rekamanBeraudio(ID_CONTOH.ibuSari);
  const mati = await minta("PATCH", "/api/saya/izin", { izin_dengar: false }, ibu);
  cek(mati.status === 200 && mati.json.audio_dihapus >= 1 && mati.json.izin.izin_dengar === false, `audio_dihapus = ${mati.json?.audio_dihapus}`);
  await minta("PATCH", "/api/saya/izin", { izin_dengar: true }, ibu);

  console.log("Keluarga minggu ini, push, kartu benda");
  const kel = await minta("GET", "/api/keluarga-minggu-ini", undefined, ibu);
  cek(lolos("keluargaMingguIni", kel.json) && kel.json.anggota.length === 2 && !JSON.stringify(kel.json).match(/skor|peringkat/i), "pengelola melihat kegiatan tanpa skor");
  cek((await minta("GET", "/api/keluarga-minggu-ini", undefined, sri)).status === 401, "bukan pengelola → 401");
  const push = await minta("POST", "/api/push", { endpoint: "https://fcm.googleapis.com/fcm/send/uji-talkly", keys: { p256dh: "BNcR-uji", auth: "uji" } }, ibu);
  cek(push.status === 204, "langganan push disimpan");
  const benda = await minta("POST", "/api/kartu-benda", { nama_benda: "bebek karet kuning" }, ibu);
  cek(lolos("kartuBenda", benda.json), `kartu benda: ${benda.json?.kata} → ${benda.json?.contoh_kalimat?.join(" / ")}`);
  cek((await minta("POST", "/api/kartu-benda", { nama_benda: "" }, ibu)).status === 422, "nama benda kosong → 422");

  console.log("Ekstraksi catatan malam (AI asli)");
  await minta("POST", "/api/laporan", { jenis: "catatan_malam", isi: { catatan: "Waktu lihat kucing Raka bilang cing, terus nunjuk lampu bilang ampu." } }, ibu);
  const { data: lap } = await db.from("laporan_keluarga").select("kata_baru").eq("anggota_id", ID_CONTOH.ibuSari).order("dibuat", { ascending: false }).limit(1).single();
  cek(lap?.kata_baru?.includes("cing") === true, `kata dari catatan bebas: ${JSON.stringify(lap?.kata_baru)}`);
  await minta("POST", "/api/laporan", { jenis: "catatan_malam", isi: { catatan: "Dulu sudah bisa bilang papa, sekarang tidak lagi." } }, ibu);
  const { data: lap2 } = await db.from("laporan_keluarga").select("kata_baru, regresi").eq("anggota_id", ID_CONTOH.ibuSari).order("dibuat", { ascending: false }).limit(1).single();
  cek(lap2?.regresi === true && !lap2.kata_baru.includes("papa"), "catatan regresi tidak menambah 'papa' sebagai kata baru");

  console.log("Hapus anggota");
  cek((await minta("DELETE", `/api/anggota/${ID_CONTOH.ibuSari}`, undefined, sri)).status === 403, "pengasuh mencabut pengelola → 403");
  cek((await minta("DELETE", `/api/anggota/${ID_CONTOH.ibuNara}`, undefined, ibu)).status === 404, "anggota keluarga lain → 404");
  const hapus = await minta("DELETE", `/api/anggota/${ID_CONTOH.mbakSri}`, undefined, ibu);
  const { count: sisaRek } = await db.from("rekaman").select("id", { count: "exact", head: true }).eq("anggota_id", ID_CONTOH.mbakSri);
  cek(hapus.status === 204 && sisaRek === 0, "pengelola mencabut Mbak Sri; rekamannya ikut terhapus");
  cek((await minta("GET", "/api/saya", undefined, sri)).status === 401, "sesi Mbak Sri tidak berlaku lagi");

  await db.from("rekaman").delete().like("id_lokal", "uji-%");
  await db.from("langganan_push").delete().like("endpoint", "%uji-talkly");
  execSync("npm run seed", { stdio: "ignore" });
  console.log(gagal ? `${gagal} cek gagal.` : "Semua lolos.");
  process.exit(gagal ? 1 : 0);
}

utama();
