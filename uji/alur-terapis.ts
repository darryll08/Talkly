// Uji alur dasbor terapis (D1, D3, D5, D6) terhadap server lokal dan TALKLY-DEV. Diakhiri dengan seed ulang.
//   node --env-file=.env.local node_modules/tsx/dist/cli.mjs uji/alur-terapis.ts http://localhost:3100

import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { API } from "../lib/kontrak/api";
import { ID_CONTOH } from "../lib/server/data-contoh";

const U = process.argv[2] ?? "http://localhost:3100";
if (new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.startsWith("faknolzliaexcushiflm")) throw new Error("Jangan uji ke produksi.");

let gagal = 0;
const cek = (ok: boolean, teks: string) => {
  console.log(`${ok ? "  ok   " : "  GAGAL"} ${teks}`);
  if (!ok) gagal++;
};
async function minta(metode: string, path: string, body?: unknown, cookie = "") {
  const res = await fetch(`${U}${path}`, { method: metode, headers: { "Content-Type": "application/json", cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
  const set = res.headers.getSetCookie().map((c) => c.split(";")[0]).filter((c) => !c.endsWith("="));
  const t = await res.text();
  return { status: res.status, json: t ? JSON.parse(t) : null, cookie: set.join("; ") };
}
const lolos = (nama: keyof typeof API, json: unknown) => {
  const e = API[nama];
  return "response" in e && e.response ? e.response.safeParse(json).success : false;
};

async function utama() {
  const nadia = (await minta("POST", "/api/demo", { sebagai: "kak_nadia" })).cookie;

  console.log("D3 dan bank");
  const m = await minta("GET", "/api/minggu-ini", undefined, nadia);
  cek(m.status === 200 && lolos("mingguIni", m.json), `minggu-ini lolos kontrak (total ${m.json?.ringkasan?.total})`);
  const bank = await minta("GET", "/api/aktivitas-bank", undefined, nadia);
  cek(lolos("aktivitasBank", bank.json) && bank.json.aktivitas.length >= 10, `bank aktivitas (${bank.json?.aktivitas?.length})`);

  console.log("D1 program anak");
  const baru = await minta("POST", "/api/anak", {
    nama: "Uji Dimas", tanggal_lahir: "2024-06-01", pendengaran: "belum_diperiksa", tahap: 1, strategi_fokus: "Menunggu",
    kata_target: ["bola", "mau", "lagi", "buka", "susu"], aktivitas_id: ["MAIN-01", "MAKAN-03"], hari_sesi: 3, jam_sesi: "09:30",
  }, nadia);
  cek(baru.status === 200 && !!baru.json?.id, `anak baru dibuat (${baru.status})`);
  const lihat = await minta("GET", `/api/anak/${baru.json.id}`, undefined, nadia);
  cek(lolos("anakLihat", lihat.json) && lihat.json.status === "terapis_meninjau" && lihat.json.aktivitas_id.join() === "MAIN-01,MAKAN-03", "pendengaran belum diperiksa → Terapis meninjau; aktivitas tersimpan");
  const ubah = await minta("PATCH", `/api/anak/${baru.json.id}`, { tahap: 2, aktivitas_id: ["MAIN-03"] }, nadia);
  const lihat2 = await minta("GET", `/api/anak/${baru.json.id}`, undefined, nadia);
  cek(ubah.status === 200 && lihat2.json.tahap === 2 && lihat2.json.aktivitas_id.join() === "MAIN-03", "PATCH tahap dan aktivitas");
  cek((await minta("POST", "/api/anak", { ...lihat.json, aktivitas_id: ["PALSU-99"] }, nadia)).status !== 200, "aktivitas di luar bank ditolak");

  console.log("D5 setelah sesi → draf → setujui → O3");
  const mulai = Date.now();
  const s1 = await minta("POST", "/api/setelah-sesi", { anak_id: ID_CONTOH.raka, catatan: "Raka mulai bersuara saat ditunggu. Lanjut strategi menunggu, tambah perluasan satu kata.", kata_baru_dikonfirmasi: ["bek"] }, nadia);
  cek(s1.status === 200 && lolos("setelahSesiSimpan", s1.json) && !!s1.json.draf, `draf rencana dibuat (${s1.json?.draf?.sumber}, ${((Date.now() - mulai) / 1000).toFixed(1)} detik)`);
  console.log(`       pesan: ${s1.json?.draf?.isi?.pesan_keluarga}`);
  console.log(`       item: ${s1.json?.draf?.isi?.item?.map((i: { aktivitas_id: string }) => i.aktivitas_id).join(", ")}`);
  const s2 = await minta("POST", "/api/setelah-sesi", { anak_id: ID_CONTOH.raka, catatan: "Catatan kedua.", kata_baru_dikonfirmasi: [] }, nadia);
  const g = await minta("GET", `/api/setelah-sesi?anak=${ID_CONTOH.raka}`, undefined, nadia);
  cek(lolos("setelahSesiLihat", g.json) && g.json.draf.id === s2.json.draf.id, "draf baru menggantikan draf lama (K5)");
  cek((await minta("POST", `/api/rencana/${s1.json.draf.id}/setujui`, { isi: s1.json.draf.isi }, nadia)).status === 409, "menyetujui draf yang sudah diganti → 409");
  const isi = { ...s2.json.draf.isi, pesan_keluarga: "Minggu ini tambah satu kata setelah Raka bersuara. Semangat!" };
  const ok = await minta("POST", `/api/rencana/${s2.json.draf.id}/setujui`, { isi, mulai_sekarang: true }, nadia);
  cek(ok.status === 200 && lolos("rencanaSetujui", ok.json), `rencana disetujui (${ok.status})`);
  const ibu = (await minta("POST", "/api/demo", { sebagai: "ibu_sari" })).cookie;
  const o3 = await minta("GET", "/api/hari-ini", undefined, ibu);
  cek(o3.json?.rencana?.pesan_keluarga === isi.pesan_keluarga && o3.json.rencana.baru === true, "rencana yang disunting tiba di O3 Ibu Sari");
  const km = await minta("GET", "/api/kemajuan", undefined, ibu);
  cek(km.json?.kata_anak?.some((k: { kata: string; sumber: string }) => k.kata === "bek" && k.sumber === "dikonfirmasi_terapis"), "kata 'bek' dikonfirmasi terapis tampil di O10");

  console.log("D6 pesan dua arah");
  const kirim = await minta("POST", "/api/pesan", { isi: "Kak, Raka tadi bilang bek!" }, ibu);
  cek(lolos("pesanKirim", kirim.json), "keluarga mengirim pesan");
  const nadia2 = (await minta("POST", "/api/demo", { sebagai: "kak_nadia" })).cookie;
  const balas = await minta("POST", `/api/anak/${ID_CONTOH.raka}/pesan`, { isi: "Hebat, Bu! Pertahankan menunggunya." }, nadia2);
  cek(lolos("anakPesanKirim", balas.json) && balas.json.dari === "terapis", "terapis membalas");
  const ibu2 = (await minta("POST", "/api/demo", { sebagai: "ibu_sari" })).cookie;
  const daftar = await minta("GET", "/api/pesan", undefined, ibu2);
  cek(lolos("pesanLihat", daftar.json) && daftar.json.pesan.at(-1).nama === "Kak Nadia", "balasan tampil di ponsel keluarga");

  console.log("Akses");
  cek((await minta("GET", `/api/anak/${ID_CONTOH.nara}`, undefined, nadia2)).status === 403, "anak terapis lain → 403");
  cek((await minta("GET", `/api/setelah-sesi?anak=${ID_CONTOH.nara}`, undefined, nadia2)).status === 403, "setelah sesi anak lain → 403");
  cek((await minta("GET", "/api/minggu-ini", undefined, ibu2)).status === 401, "keluarga membuka D3 → 401");

  // Anak buatan uji bukan data_contoh, jadi dihapus terpisah sebelum seed ulang.
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  await db.from("anak").delete().like("nama", "Uji %");
  execSync("npm run seed", { stdio: "ignore" });
  console.log(gagal ? `${gagal} cek gagal.` : "Semua lolos.");
  process.exit(gagal ? 1 : 0);
}

utama();
