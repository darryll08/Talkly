// Cek hasil migrasi di satu proyek Supabase (A1.1–A1.2):
//   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/cek-skema.ts
//   node --env-file=.env.vercel-produksi node_modules/tsx/dist/cli.mjs scripts/cek-skema.ts
// Lolos bila 18 tabel terbaca dengan service role, anon membaca 0 baris di semua tabel, dan bucket audio privat.

import { createClient } from "@supabase/supabase-js";

const TABEL = [
  "klinik", "terapis", "anak", "anggota", "undangan", "aktivitas", "rencana", "rencana_item", "log_aktivitas",
  "rekaman", "hasil_rekaman", "laporan_keluarga", "pesan", "catatan_sesi", "draf_rencana", "riwayat_status",
  "log_dengar", "langganan_push",
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const servis = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });

let gagal = 0;
const lapor = (ok: boolean, teks: string) => {
  console.log(`${ok ? "  ok   " : "  GAGAL"} ${teks}`);
  if (!ok) gagal++;
};

async function utama() {
  console.log(`Proyek ${new URL(url).hostname.split(".")[0]}`);
  for (const t of TABEL) {
    const s = await servis.from(t).select("*", { count: "exact" }).limit(1);
    const a = await anon.from(t).select("*").limit(1);
    const anonKosong = !!a.error || (a.data?.length ?? 0) === 0;
    lapor(!s.error && anonKosong, `${t}: ${s.error ? s.error.message : `${s.count} baris`}; anon ${a.error ? "ditolak" : `${a.data?.length ?? 0} baris`}`);
  }

  const { data: bucket, error } = await servis.storage.getBucket("audio");
  lapor(!error && bucket?.public === false, `bucket audio ${error ? error.message : bucket?.public ? "PUBLIK" : "privat"}`);

  console.log(gagal ? `${gagal} cek gagal.` : "Semua lolos.");
  process.exit(gagal ? 1 : 0);
}

utama();
