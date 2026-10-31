// Uji alur keluarga (A1.3, A1.4) terhadap server lokal dan TALKLY-DEV. Diakhiri dengan seed ulang.
//   node --env-file=.env.local node_modules/tsx/dist/cli.mjs uji/alur-keluarga.ts http://localhost:3100

import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { API } from "../lib/kontrak/api";
import { hashUndangan } from "../lib/keluarga/kode";
import { ID_CONTOH } from "../lib/server/data-contoh";

const U = process.argv[2] ?? "http://localhost:3100";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
if (new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.startsWith("faknolzliaexcushiflm")) throw new Error("Jangan uji ke produksi.");

let gagal = 0;
const cek = (ok: boolean, teks: string) => {
  console.log(`${ok ? "  ok   " : "  GAGAL"} ${teks}`);
  if (!ok) gagal++;
};

async function minta(metode: string, path: string, body?: unknown, cookie = "") {
  const res = await fetch(`${U}${path}`, {
    method: metode,
    headers: { "Content-Type": "application/json", cookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const set = res.headers.getSetCookie().map((c) => c.split(";")[0]).filter((c) => !c.endsWith("="));
  const teks = await res.text();
  return { status: res.status, json: teks ? JSON.parse(teks) : null, cookie: set.join("; ") };
}

async function utama() {
  const nadia = (await minta("POST", "/api/demo", { sebagai: "kak_nadia" })).cookie;

  console.log("Undangan dan gabung");
  const u1 = await minta("POST", "/api/undangan", { anak_id: ID_CONTOH.raka, peran: "nenek" }, nadia);
  cek(u1.status === 200 && API.undanganBuat.response.safeParse(u1.json).success, `terapis membuat undangan (${u1.status})`);
  const kode = u1.json.kode as string;
  const lihat = await minta("GET", `/api/undangan/${kode.toLowerCase()}`);
  cek(lihat.json?.status === "menunggu" && lihat.json.anak.nama === "Raka" && lihat.json.terapis.nama === "Kak Nadia", "pratinjau: Raka · Kak Nadia (huruf kecil tetap cocok)");
  const g = await minta("POST", "/api/gabung", { kode, nama: "Nenek Uji" });
  cek(g.status === 200 && /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(g.json.kode_masuk), `gabung → kode masuk pribadi (${g.status})`);
  const saya = await minta("GET", "/api/saya", undefined, g.cookie);
  cek(saya.json?.anggota?.nama === "Nenek Uji" && saya.json.anggota.peran === "nenek" && saya.json.anggota.pengelola === false, "anggota baru masuk sebagai nenek, bukan pengelola");
  cek((await minta("POST", "/api/gabung", { kode, nama: "Orang Lain" })).status === 409, "kode yang sama dipakai lagi → 409");
  cek((await minta("GET", `/api/undangan/${kode}`)).json?.status === "dipakai", "pratinjau menunjukkan dipakai");

  console.log("Masuk di ponsel baru");
  cek((await minta("POST", "/api/masuk", { kode_masuk: g.json.kode_masuk.toLowerCase() })).status === 204, "kode masuk benar → 204");
  for (let i = 0; i < 4; i++) await minta("POST", "/api/masuk", { kode_masuk: `${g.json.kode_masuk.slice(0, 4)}-ZZZZ-ZZZZ` });
  const kunci = await minta("POST", "/api/masuk", { kode_masuk: `${g.json.kode_masuk.slice(0, 4)}-ZZZZ-ZZZZ` });
  cek(kunci.status === 423, `5 kali salah → 423 (${kunci.status})`);
  cek((await minta("POST", "/api/masuk", { kode_masuk: g.json.kode_masuk })).status === 423, "kode benar saat terkunci tetap 423");
  await db.from("anggota").update({ terkunci_sampai: new Date(Date.now() - 1000).toISOString() }).eq("id", g.json.anggota_id);
  cek((await minta("POST", "/api/masuk", { kode_masuk: g.json.kode_masuk })).status === 204, "setelah 15 menit (disimulasikan) → 204");
  const baru = await minta("POST", "/api/saya/kode-masuk", undefined, g.cookie);
  cek(baru.status === 200 && baru.json.kode_masuk !== g.json.kode_masuk, "ganti kode masuk");
  cek((await minta("POST", "/api/masuk", { kode_masuk: g.json.kode_masuk })).status === 401, "kode lama tidak berlaku lagi");

  console.log("Batas");
  await db.from("undangan").insert({ kode_hash: hashUndangan("LAMA2345"), anak_id: ID_CONTOH.raka, peran: "ayah", kedaluwarsa: new Date(Date.now() - 1000).toISOString() });
  cek((await minta("POST", "/api/gabung", { kode: "LAMA2345", nama: "Ayah Uji" })).status === 410, "kode kedaluwarsa → 410");
  const u2 = await minta("POST", "/api/undangan", { anak_id: ID_CONTOH.raka, peran: "ayah" }, nadia);
  cek((await minta("POST", "/api/gabung", { kode: u2.json.kode, nama: "Ayah Uji" })).status === 200, "anggota keempat bergabung");
  cek((await minta("POST", "/api/undangan", { anak_id: ID_CONTOH.raka, peran: "kakek" }, nadia)).status === 409, "undangan untuk anggota kelima → 409");
  const ibu = (await minta("POST", "/api/demo", { sebagai: "ibu_sari" })).cookie;
  cek((await minta("POST", "/api/undangan", { anak_id: ID_CONTOH.raka, peran: "pengasuh" }, ibu)).status === 409, "pengelola juga ditolak saat sudah 4 anggota");
  const sri = (await minta("POST", "/api/demo", { sebagai: "mbak_sri" })).cookie;
  cek((await minta("POST", "/api/undangan", { anak_id: ID_CONTOH.raka, peran: "pengasuh" }, sri)).status === 401, "bukan pengelola tidak bisa mengundang → 401");
  await db.from("anak").update({ pendengaran: null }).eq("id", ID_CONTOH.raka);
  await db.from("anggota").update({ aktif: false }).eq("nama", "Ayah Uji");
  cek((await minta("POST", "/api/undangan", { anak_id: ID_CONTOH.raka, peran: "kakek" }, nadia)).status === 409, "pendengaran belum diisi → 409");
  cek((await minta("POST", "/api/undangan", { anak_id: ID_CONTOH.nara, peran: "kakek" }, nadia)).status === 403, "terapis lain mengundang ke anak Nara → 403");
  const daftar = await minta("GET", `/api/anak/${ID_CONTOH.raka}/undangan`, undefined, nadia);
  cek(API.anakUndangan.response.safeParse(daftar.json).success && daftar.json.undangan.some((x: { dipakai_oleh: string }) => x.dipakai_oleh === "Nenek Uji"), "daftar undangan D2 lolos kontrak");

  execSync("npm run seed", { stdio: "ignore" });
  console.log(gagal ? `${gagal} cek gagal.` : "Semua lolos.");
  process.exit(gagal ? 1 : 0);
}

utama();
