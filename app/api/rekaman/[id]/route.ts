import { after } from "next/server";
import { HasilRekaman } from "@/lib/kontrak/hasil";
import { denganAkses, dbKeluarga } from "@/lib/server/akses";
import { galat } from "@/lib/server/respons";
import { MACET_MS, prosesRekaman } from "@/lib/ukur/proses";

// O5b/O6/O7: status dan hasil satu rekaman, hanya untuk anggota keluarga anak yang sama (K1, K2).
// Rekaman yang macet di antrean lebih dari 2 menit diproses ulang.

export const maxDuration = 60;

export const GET = denganAkses(["anggota"], async (_req, { saya, params }) => {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return galat(404, "Rekaman tidak ditemukan.");
  const { data: r } = await dbKeluarga(saya.anggota)
    .pilih("rekaman", "id, status, alasan_tolak, durasi_s, rekaman_contoh, proses_mulai, dibuat, perekam:anggota_id (id, nama), hasil:hasil_rekaman (hasil)")
    .eq("id", params.id)
    .maybeSingle();
  if (!r) return galat(404, "Rekaman tidak ditemukan.");
  const baris = r as unknown as {
    id: string;
    status: "antre" | "dinilai" | "ditolak";
    alasan_tolak: string | null;
    durasi_s: number | null;
    rekaman_contoh: boolean;
    proses_mulai: string | null;
    dibuat: string;
    perekam: { id: string; nama: string } | { id: string; nama: string }[];
    hasil: { hasil: unknown } | { hasil: unknown }[] | null;
  };

  if (baris.status === "antre") {
    const sejak = Date.parse(baris.proses_mulai ?? baris.dibuat);
    if (Date.now() - sejak > MACET_MS) after(() => prosesRekaman(baris.id));
  }

  const h = Array.isArray(baris.hasil) ? baris.hasil[0] : baris.hasil;
  const hasil = h ? HasilRekaman.safeParse(h.hasil) : null;
  return Response.json({
    id: baris.id,
    status: baris.status,
    alasan_tolak: baris.alasan_tolak,
    durasi_s: baris.durasi_s,
    rekaman_contoh: baris.rekaman_contoh,
    perekam: Array.isArray(baris.perekam) ? baris.perekam[0] : baris.perekam,
    hasil: hasil?.success ? hasil.data : null,
  });
});
