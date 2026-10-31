// Uji RLS dengan data terisi (A1.2), ke TALKLY-DEV setelah `npm run seed`:
//   node --env-file=.env.local node_modules/tsx/dist/cli.mjs uji/rls.ts
// Lolos bila anon membaca 0 baris di semua tabel, dan terapis yang masuk lewat Supabase Auth
// hanya melihat anak yang ditanganinya beserta data turunannya.

import { createClient } from "@supabase/supabase-js";
import { EMAIL_TERAPIS_CONTOH, ID_CONTOH } from "../lib/server/data-contoh";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const TABEL = ["klinik", "terapis", "anak", "anggota", "undangan", "aktivitas", "rencana", "rencana_item", "log_aktivitas", "rekaman", "hasil_rekaman", "laporan_keluarga", "pesan", "catatan_sesi", "draf_rencana", "riwayat_status", "log_dengar", "langganan_push"];

let gagal = 0;
const cek = (ok: boolean, teks: string) => {
  console.log(`${ok ? "  ok   " : "  GAGAL"} ${teks}`);
  if (!ok) gagal++;
};

async function masuk(email: string) {
  const c = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: process.env.DEMO_TERAPIS_KATA_SANDI! });
  if (error) throw new Error(`masuk ${email}: ${error.message}`);
  return c;
}

async function utama() {
  console.log("Anon");
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  for (const t of TABEL) {
    const { data, error } = await anon.from(t).select("*").limit(5);
    cek(!!error || (data?.length ?? 0) === 0, `${t}: anon ${error ? "ditolak" : `${data?.length} baris`}`);
  }

  console.log("Terapis");
  const nadia = await masuk(EMAIL_TERAPIS_CONTOH.nadia);
  const uji = await masuk(EMAIL_TERAPIS_CONTOH.uji);
  const anakNadia = (await nadia.from("anak").select("id")).data ?? [];
  const anakUji = (await uji.from("anak").select("id")).data ?? [];
  cek(anakNadia.length === 9 && !anakNadia.some((a) => a.id === ID_CONTOH.nara), `Kak Nadia melihat ${anakNadia.length} anak, tanpa Nara`);
  cek(anakUji.length === 1 && anakUji[0].id === ID_CONTOH.nara, `Kak Uji hanya melihat Nara (${anakUji.length})`);
  const rekUji = (await uji.from("rekaman").select("id").eq("anak_id", ID_CONTOH.raka)).data ?? [];
  const lapUji = (await uji.from("laporan_keluarga").select("id").eq("anak_id", ID_CONTOH.raka)).data ?? [];
  const hasilUji = (await uji.from("hasil_rekaman").select("rekaman_id")).data ?? [];
  cek(rekUji.length === 0 && lapUji.length === 0 && hasilUji.length === 0, "Kak Uji tidak bisa membaca rekaman, hasil, atau laporan Raka");
  const rekNadia = (await nadia.from("rekaman").select("id").eq("anak_id", ID_CONTOH.raka)).data ?? [];
  cek(rekNadia.length > 0, `Kak Nadia membaca rekaman Raka (${rekNadia.length})`);
  const tulis = await nadia.from("anak").update({ nama: "Ubah" }).eq("id", ID_CONTOH.raka).select("id");
  cek(!tulis.data?.length, "terapis tidak bisa menulis langsung ke database (hanya lewat app/api)");

  console.log(gagal ? `${gagal} cek gagal.` : "Semua lolos.");
  process.exit(gagal ? 1 : 0);
}

utama();
