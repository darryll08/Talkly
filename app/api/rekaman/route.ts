import { after } from "next/server";
import { BATAS_UKURAN_AUDIO, MetaRekaman, MIME_AUDIO } from "@/lib/kontrak/rekaman";
import { denganAkses } from "@/lib/server/akses";
import { galat } from "@/lib/server/respons";
import { db } from "@/lib/server/supabase";
import { prosesRekaman } from "@/lib/ukur/proses";

// O5 unggah rekaman: form-data `audio` + `meta`. Balas 202 segera, nilai di after().
// 400/413/415/422 berarti ponsel tidak perlu mengulang; galat lain disimpan di antrean ponsel.

export const maxDuration = 60;

export const POST = denganAkses(["anggota"], async (req, { saya }) => {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return galat(400, "Data rekaman tidak terbaca.");
  }
  const audio = form.get("audio");
  if (!(audio instanceof Blob)) return galat(400, "Berkas rekaman tidak ada.");
  if (audio.size > BATAS_UKURAN_AUDIO) return galat(413, "Berkas rekaman lebih dari 5 MB.");
  const mime = audio.type.split(";")[0];
  if (!(MIME_AUDIO as readonly string[]).includes(mime)) return galat(415, "Format rekaman tidak didukung.");

  let meta: MetaRekaman;
  try {
    meta = MetaRekaman.parse(JSON.parse(String(form.get("meta") ?? "")));
  } catch {
    return galat(400, "Data rekaman belum lengkap.");
  }

  // Unggahan ulang dengan id_lokal yang sama mengembalikan rekaman yang sudah ada.
  const { data: lama } = await db().from("rekaman").select("id, anak_id").eq("id_lokal", meta.id_lokal).maybeSingle();
  if (lama) {
    if (lama.anak_id !== saya.anggota.anak_id) return galat(400, "Rekaman ini milik keluarga lain.");
    return Response.json({ rekaman_id: lama.id }, { status: 202 });
  }

  // Perekam boleh anggota lain di keluarga yang sama (misalnya pengasuh memakai ponsel Ibu), asal izin nilainya menyala.
  const { data: perekam } = await db()
    .from("anggota")
    .select("id, izin_nilai")
    .eq("id", meta.perekam_id)
    .eq("anak_id", saya.anggota.anak_id)
    .eq("aktif", true)
    .maybeSingle();
  if (!perekam) return galat(400, "Perekam tidak dikenal di keluarga ini.");
  if (!perekam.izin_nilai) return galat(422, "Izin penilaian rekaman untuk perekam ini belum dinyalakan di Profil.");

  const id = crypto.randomUUID();
  const path = `${saya.anggota.anak_id}/${id}.webm`;
  const { error: gagalUnggah } = await db().storage.from("audio").upload(path, audio, { contentType: mime, upsert: false });
  if (gagalUnggah) throw gagalUnggah;

  // MetaRekaman.parse membuang kunci di luar kontrak, jadi ponsel tidak bisa menyisipkan transkrip sendiri.
  const { error } = await db().from("rekaman").insert({
    id,
    id_lokal: meta.id_lokal,
    anggota_id: perekam.id,
    anak_id: saya.anggota.anak_id,
    rencana_item_id: meta.rencana_item_id ?? null,
    path_audio: path,
    durasi_s: meta.durasi_s,
    meta,
    rekaman_contoh: meta.rekaman_cadangan,
  });
  if (error) {
    await db().storage.from("audio").remove([path]);
    if (error.code === "23505") {
      const { data: ada } = await db().from("rekaman").select("id").eq("id_lokal", meta.id_lokal).single();
      return Response.json({ rekaman_id: ada!.id }, { status: 202 });
    }
    throw error;
  }

  after(() => prosesRekaman(id));
  return Response.json({ rekaman_id: id }, { status: 202 });
});
