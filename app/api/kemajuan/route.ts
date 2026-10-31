import { denganAkses } from "@/lib/server/akses";
import { db } from "@/lib/server/supabase";
import { anakRingkas } from "@/lib/keluarga/anggota";
import { muatRekaman, strategi, tren } from "@/lib/status/agregat";

// O10 Kemajuan: dua jenis kemajuan (proposal S4).
//   * Cara anggota ini sendiri dari rekamannya (data terukur), tanpa membandingkan dengan anggota lain.
//   * Kata anak dari catatan malam (dilaporkan keluarga) dan dari terapis setelah sesi (dikonfirmasi).

export const GET = denganAkses(["anggota"], async (_req, { saya }) => {
  const a = saya.anggota;
  const [anak, rekamanSemua, laporan, sesi] = await Promise.all([
    anakRingkas(a.anak_id),
    muatRekaman(a.anak_id, 35),
    db().from("laporan_keluarga").select("tanggal, kata_baru").eq("anak_id", a.anak_id).order("tanggal"),
    db().from("catatan_sesi").select("tanggal, kata_baru_dikonfirmasi").eq("anak_id", a.anak_id).order("tanggal"),
  ]);
  const milikSaya = rekamanSemua.filter((r) => r.anggota_id === a.id);

  const kata = new Map<string, { kata: string; sejak: string; sumber: "dilaporkan_keluarga" | "dikonfirmasi_terapis" }>();
  for (const l of laporan.data ?? []) {
    for (const k of l.kata_baru ?? []) if (!kata.has(k)) kata.set(k, { kata: k, sejak: l.tanggal, sumber: "dilaporkan_keluarga" });
  }
  for (const s of sesi.data ?? []) {
    for (const k of s.kata_baru_dikonfirmasi ?? []) {
      const ada = kata.get(k);
      kata.set(k, { kata: k, sejak: ada?.sejak ?? s.tanggal, sumber: "dikonfirmasi_terapis" });
    }
  }

  return Response.json({
    anak,
    strategi: strategi(milikSaya),
    tren: tren(milikSaya),
    kata_anak: [...kata.values()].sort((x, y) => (x.sejak < y.sejak ? 1 : -1)),
  });
});
