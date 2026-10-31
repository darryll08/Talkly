import { API } from "@/lib/kontrak/api";
import { cekTerapisMenangani, denganAkses } from "@/lib/server/akses";
import { bacaBody, galat } from "@/lib/server/respons";
import { db } from "@/lib/server/supabase";
import { jumlahAnggotaAktif } from "@/lib/keluarga/anggota-baru";
import { buatKodeUndangan, HARI_UNDANGAN, hashUndangan, MAKS_ANGGOTA } from "@/lib/keluarga/kode";

// D2 (terapis) dan O12a (pengelola keluarga): buat kode undangan sekali pakai, berlaku 7 hari.
// Ditolak 409 bila pendengaran anak belum diisi terapis, atau keluarga sudah 4 anggota.

export const POST = denganAkses(["terapis", "pengelola"], async (req, { saya }) => {
  const body = await bacaBody(req, API.undanganBuat.request);
  if (body instanceof Response) return body;

  if (saya.jenis === "terapis") {
    const tolak = await cekTerapisMenangani(saya.terapis.id, body.anak_id);
    if (tolak) return tolak;
  } else if (body.anak_id !== saya.anggota.anak_id) {
    return galat(404, "Data anak tidak ditemukan.");
  }

  const { data: anak } = await db().from("anak").select("pendengaran").eq("id", body.anak_id).single();
  if (!anak?.pendengaran) return galat(409, "Isi status pendengaran anak di Program anak sebelum mengundang keluarga.");
  if ((await jumlahAnggotaAktif(body.anak_id)) >= MAKS_ANGGOTA) return galat(409, `Keluarga ini sudah ${MAKS_ANGGOTA} anggota.`);

  const kode = buatKodeUndangan();
  const kedaluwarsa = new Date(Date.now() + HARI_UNDANGAN * 86_400_000).toISOString();
  const { error } = await db().from("undangan").insert({
    kode_hash: hashUndangan(kode),
    anak_id: body.anak_id,
    peran: body.peran,
    pengelola_keluarga: false,
    dibuat_terapis: saya.jenis === "terapis" ? saya.terapis.id : null,
    dibuat_anggota: saya.jenis === "anggota" ? saya.anggota.id : null,
    kedaluwarsa,
  });
  if (error) throw error;

  const asal = new URL(req.url).origin;
  return Response.json({ kode, tautan: `${asal}/gabung?kode=${kode}`, kedaluwarsa });
});
