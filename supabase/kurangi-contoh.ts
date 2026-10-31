import { createClient } from "@supabase/supabase-js";
import { ANAK_LAIN } from "./seed-riwayat";

// Mengurangi anak data contoh di database yang sudah di-seed tanpa seed ulang (seed ulang menghapus seluruh klinik
// contoh, termasuk anak yang dibuat sendiri oleh terapis). Hanya anak dengan data_contoh = true yang namanya tidak
// ada di daftar seed sekarang yang dihapus; turunannya (anggota, rekaman, laporan) ikut terhapus lewat cascade.
// Tanpa --hapus hanya menampilkan apa yang akan dihapus.
//   node --env-file=.env.vercel-produksi node_modules/tsx/dist/cli.mjs supabase/kurangi-contoh.ts [--hapus]

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !kunci)
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diisi",
  );
const db = createClient(url, kunci, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function utama() {
  const simpan = new Set(["Raka", "Nara", ...ANAK_LAIN]);
  const { data, error } = await db
    .from("anak")
    .select("id, nama")
    .eq("data_contoh", true);
  if (error) throw error;
  const buang = (data ?? []).filter((a) => !simpan.has(a.nama));

  console.log(
    `Anak data contoh: ${data?.length ?? 0}. Dipertahankan: ${(data?.length ?? 0) - buang.length}. Dihapus: ${buang.length}.`,
  );
  console.log(buang.map((a) => a.nama).join(", ") || "(tidak ada)");

  if (process.argv.includes("--hapus") && buang.length) {
    const { error: e } = await db
      .from("anak")
      .delete()
      .in(
        "id",
        buang.map((a) => a.id),
      )
      .eq("data_contoh", true);
    if (e) throw e;
    console.log("Selesai dihapus.");
  } else if (buang.length) {
    console.log("Belum ada yang dihapus. Jalankan lagi dengan --hapus.");
  }
}

utama().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
