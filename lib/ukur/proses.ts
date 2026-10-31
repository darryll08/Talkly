import type { HasilRekaman } from "@/lib/kontrak/hasil";
import { MetaRekaman } from "@/lib/kontrak/rekaman";
import { nilaiCadangan, nilaiRekaman, type MasukanNilai } from "@/lib/ai/nilai";
import { sapaan } from "@/lib/keluarga/anggota";
import { naikkanStatus } from "@/lib/status/naikkan";
import { db } from "@/lib/server/supabase";
import { periksaMutu } from "./mutu";
import { tentukanPeran } from "./pembicara";
import { GagalStt, keUcapan, transkripsi } from "./stt";
import type { Transkrip } from "./tipe";
import { ukur, type HasilUkur } from "./ukur";

// Alur server satu rekaman: STT → mutu → perekam & suara anak → ukur → AI → simpan → hapus audio.
// Dipanggil lewat after() setelah unggah, dan diulang oleh GET /api/rekaman/:id bila macet > 2 menit.

export const MACET_MS = 2 * 60_000;
const SIMPAN_AUDIO_HARI = 7;

type BarisRekaman = {
  id: string;
  anak_id: string;
  anggota_id: string;
  path_audio: string | null;
  durasi_s: number | null;
  meta: Record<string, unknown>;
};

/** Ambil hak memproses: hanya satu pemanggil yang berhasil untuk rekaman antre yang belum/macet diproses. */
async function klaim(id: string): Promise<BarisRekaman | null> {
  const batas = new Date(Date.now() - MACET_MS).toISOString();
  const { data } = await db()
    .from("rekaman")
    .update({ proses_mulai: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "antre")
    .or(`proses_mulai.is.null,proses_mulai.lt.${batas}`)
    .select("id, anak_id, anggota_id, path_audio, durasi_s, meta")
    .maybeSingle();
  return (data as BarisRekaman | null) ?? null;
}

async function hapusAudio(rekaman: { id: string; path_audio: string | null }) {
  if (!rekaman.path_audio) return;
  await db().storage.from("audio").remove([rekaman.path_audio]);
  await db().from("rekaman").update({ path_audio: null, audio_kedaluwarsa: null }).eq("id", rekaman.id);
}

export async function prosesRekaman(id: string): Promise<void> {
  const r = await klaim(id);
  if (!r) return;
  try {
    await proses(r);
  } catch (e) {
    // Biarkan antre; GET berikutnya mencoba lagi setelah MACET_MS.
    console.error(`proses rekaman ${id}`, e);
  }
}

async function proses(r: BarisRekaman) {
  const meta = MetaRekaman.parse({ ...r.meta, id_lokal: (r.meta.id_lokal as string) ?? r.id });
  const [{ data: anak }, { data: anggota }] = await Promise.all([
    db().from("anak").select("nama, tahap, kata_target, ukuran_nonaktif").eq("id", r.anak_id).single(),
    db().from("anggota").select("id, nama, peran, izin_dengar").eq("anak_id", r.anak_id),
  ]);
  if (!anak || !anggota) throw new Error("anak atau anggota tidak ditemukan");
  const perekam = anggota.find((a) => a.id === r.anggota_id)!;

  // 1. Transkrip: putar ulang dari meta bila sudah pernah, supaya kredit STT tidak terpakai dua kali.
  let transkrip = (r.meta.transkrip as Transkrip | undefined) ?? null;
  let sttGagal = false;
  if (!transkrip) {
    try {
      if (!r.path_audio) throw new GagalStt("audio tidak ada");
      const { data: berkas, error } = await db().storage.from("audio").download(r.path_audio);
      if (error || !berkas) throw new GagalStt(`unduh audio: ${error?.message}`);
      transkrip = await transkripsi(berkas);
      await db().from("rekaman").update({ meta: { ...r.meta, transkrip } }).eq("id", r.id);
    } catch (e) {
      if (!(e instanceof GagalStt)) throw e;
      sttGagal = true;
      console.error(`STT gagal untuk ${r.id}: ${e.message}`);
    }
  }

  const durasi = r.durasi_s ?? meta.durasi_s;
  const ucapan = transkrip ? keUcapan(transkrip) : [];
  const peran = tentukanPeran(ucapan, meta.kandidat_suara_anak);

  // 2. Mutu. Bila kedua STT gagal, rekaman tetap dinilai dari jejak ponsel (K11).
  const mutu = sttGagal
    ? {
        lolos: durasi >= 40 && !meta.terputus,
        alasan: meta.terputus ? "Rekaman terhenti di tengah jalan. Biarkan layar tetap menyala selama satu menit." : durasi < 40 ? `Rekaman baru ${Math.round(durasi)} detik. Rekam paling tidak 40 detik.` : null,
        durasi_s: durasi,
        kata_perekam: 0,
      }
    : periksaMutu({ durasi_s: durasi, terputus: meta.terputus, ucapan, perekam: peran.perekam, peristiwa: transkrip!.peristiwa, jejak: meta.jejak });

  const stt: HasilRekaman["stt"] = {
    penyedia: sttGagal ? "tidak_ada" : transkrip!.penyedia,
    sumber_suara_anak: sttGagal ? (meta.kandidat_suara_anak.length ? "celah_hening" : "tidak_ada") : peran.sumber_suara_anak,
  };

  if (!mutu.lolos) {
    const hasil: HasilRekaman = { rekaman_id: r.id, mutu, stt, ajakan: [], suara_anak: [], ukuran: null, umpan_balik: null, laporan_terapis: null, naikkan_status: false };
    await db().from("hasil_rekaman").upsert({ rekaman_id: r.id, hasil });
    await db().from("rekaman").update({ status: "ditolak", alasan_tolak: mutu.alasan }).eq("id", r.id);
    await hapusAudio(r);
    await cekTolakBeruntun(r.anak_id, r.anggota_id);
    return;
  }

  // 3. Ukur. Tanpa transkrip, ajakan tidak bisa dikenali: hanya vokalisasi dari jejak ponsel.
  const hasilUkur: HasilUkur = sttGagal
    ? {
        ajakan: [],
        ukuran: {
          jumlah_ajakan: 0,
          ajakan_berhasil: 0,
          memotong: 0,
          jeda_rata_s: null,
          giliran: 0,
          vokalisasi_anak: meta.kandidat_suara_anak.length,
          ucapan_kata_target: 0,
          pertanyaan_beruntun: 0,
          suruhan_beruntun: 0,
        },
        momen: null,
        kandidat_versi_anak: [],
      }
    : ukur({
        ucapan,
        peran,
        kata_target: anak.kata_target,
        durasi_s: durasi,
        mulai_menunggu_s: meta.mulai_menunggu_s,
        ukuran_nonaktif: anak.ukuran_nonaktif ?? [],
      });

  // 4. AI (atau cadangan langsung bila tidak ada transkrip).
  const masukanAi: MasukanNilai = {
    ucapan,
    perekam: peran.perekam,
    suara_anak: peran.suara_anak,
    ukur: hasilUkur,
    anak: { nama: anak.nama, tahap: anak.tahap, kata_target: anak.kata_target },
    nama_anggota: anggota.map((a) => ({ nama: a.nama, peran: a.peran })),
    sapaan: sapaan(perekam.peran, perekam.nama),
  };
  const nilai = sttGagal ? nilaiCadangan(masukanAi, ["STT gagal"]) : await nilaiRekaman(masukanAi);

  const hasil: HasilRekaman = {
    rekaman_id: r.id,
    mutu,
    stt,
    ajakan: hasilUkur.ajakan,
    suara_anak: peran.suara_anak.map((s) => ({ t_mulai: Math.round(s.t_mulai * 10) / 10, t_selesai: Math.round(s.t_selesai * 10) / 10 })),
    ukuran: { ...hasilUkur.ukuran, perluasan_ai: nilai.perluasan_ai },
    umpan_balik: nilai.umpan_balik,
    laporan_terapis: nilai.laporan_terapis,
    naikkan_status: nilai.naikkan_status,
  };
  await db().from("hasil_rekaman").upsert({ rekaman_id: r.id, hasil });
  await db().from("rekaman").update({ status: "dinilai", alasan_tolak: null }).eq("id", r.id);

  // 5. Audio: dihapus segera bila izin dengar perekam mati, selain itu disimpan 7 hari.
  if (perekam.izin_dengar) {
    const kedaluwarsa = new Date(Date.now() + SIMPAN_AUDIO_HARI * 86_400_000).toISOString();
    await db().from("rekaman").update({ audio_kedaluwarsa: kedaluwarsa }).eq("id", r.id);
  } else {
    await hapusAudio(r);
  }

  if (nilai.naikkan_status) {
    await naikkanStatus(r.anak_id, "terapis_meninjau", sttGagal ? "Rekaman tidak dapat ditranskripsi" : "Keluaran AI meragukan");
  }
}

/** Tabel 2: rekaman ditolak tiga kali berturut-turut → Terapis meninjau. */
async function cekTolakBeruntun(anakId: string, anggotaId: string) {
  const { data } = await db()
    .from("rekaman")
    .select("status")
    .eq("anggota_id", anggotaId)
    .neq("status", "antre")
    .order("dibuat", { ascending: false })
    .limit(3);
  if (data?.length === 3 && data.every((x) => x.status === "ditolak")) {
    await naikkanStatus(anakId, "terapis_meninjau", "Rekaman ditolak tiga kali berturut-turut");
  }
}
