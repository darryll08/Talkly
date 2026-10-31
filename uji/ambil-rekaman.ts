// Ambil rekaman uji N01–N15 dari database (A7.1). Rekaman dibuat lewat aplikasi di HP, biasanya di produksi:
//   node --env-file=.env.vercel-produksi node_modules/tsx/dist/cli.mjs uji/ambil-rekaman.ts --terbaru 15
//   node --env-file=.env.vercel-produksi node_modules/tsx/dist/cli.mjs uji/ambil-rekaman.ts --peta N03=<id>,N07=<id>
// --terbaru N memetakan N rekaman terakhir Raka (urut waktu) ke N01, N02, ... Pakai --peta untuk rekaman ulang.
// Menyimpan transkrip + hasil ke data/uji/transkrip/Nxx.json (ikut git) dan audio ke data/uji/rekaman/Nxx.webm
// (tidak ikut git) untuk diukur di Audacity. Tidak memanggil STT lagi.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { ID_CONTOH } from "../lib/server/data-contoh";
import { NASKAH } from "./naskah";

const AKAR = join(import.meta.dirname, "..");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const arg = (nama: string) => {
  const i = process.argv.indexOf(nama);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

async function utama() {
  const berkasPeta = join(AKAR, "data", "uji", "rekaman.json");
  const peta: Record<string, string> = existsSync(berkasPeta) ? JSON.parse(readFileSync(berkasPeta, "utf8")) : {};

  const terbaru = Number(arg("--terbaru") ?? 0);
  if (terbaru > 0) {
    const { data, error } = await db
      .from("rekaman")
      .select("id, dibuat")
      .eq("anak_id", ID_CONTOH.raka)
      .not("id_lokal", "like", "contoh-%")
      .not("id_lokal", "like", "uji-%")
      .order("dibuat", { ascending: false })
      .limit(terbaru);
    if (error) throw error;
    (data ?? []).reverse().forEach((r, i) => (peta[NASKAH[i].id] = r.id));
  }
  for (const pasangan of (arg("--peta") ?? "").split(",").filter(Boolean)) {
    const [kode, id] = pasangan.split("=");
    peta[kode.trim().toUpperCase()] = id.trim();
  }
  if (Object.keys(peta).length === 0) throw new Error("Belum ada rekaman yang dipetakan. Pakai --terbaru 15 atau --peta N01=<id>.");

  mkdirSync(join(AKAR, "data", "uji", "transkrip"), { recursive: true });
  mkdirSync(join(AKAR, "data", "uji", "rekaman"), { recursive: true });
  for (const [kode, id] of Object.entries(peta).sort()) {
    const { data: r } = await db
      .from("rekaman")
      .select("id, status, alasan_tolak, durasi_s, meta, path_audio, dibuat, perekam:anggota_id (nama), hasil:hasil_rekaman (hasil)")
      .eq("id", id)
      .maybeSingle();
    if (!r) {
      console.log(`${kode} ${id}: tidak ditemukan`);
      continue;
    }
    const h = Array.isArray(r.hasil) ? r.hasil[0] : r.hasil;
    const perekam = Array.isArray(r.perekam) ? r.perekam[0] : r.perekam;
    const meta = r.meta as Record<string, unknown>;
    writeFileSync(
      join(AKAR, "data", "uji", "transkrip", `${kode}.json`),
      JSON.stringify({ kode, rekaman_id: r.id, dibuat: r.dibuat, perekam: (perekam as { nama: string } | null)?.nama, status: r.status, alasan_tolak: r.alasan_tolak, durasi_s: r.durasi_s, meta, hasil: h?.hasil ?? null }, null, 2) + "\n",
    );
    let audio = "audio sudah dihapus";
    if (r.path_audio) {
      const { data: berkas } = await db.storage.from("audio").download(r.path_audio);
      if (berkas) {
        writeFileSync(join(AKAR, "data", "uji", "rekaman", `${kode}.webm`), Buffer.from(await berkas.arrayBuffer()));
        audio = `audio → data/uji/rekaman/${kode}.webm`;
      }
    }
    console.log(`${kode} ${r.status.padEnd(8)} ${String(r.durasi_s ?? "-").padStart(5)} s  transkrip ${meta.transkrip ? "ada" : "TIDAK ADA"}  ${audio}`);
  }
  writeFileSync(berkasPeta, JSON.stringify(peta, null, 2) + "\n");
}

utama().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
