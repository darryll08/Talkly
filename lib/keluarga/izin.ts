import { db } from "@/lib/server/supabase";

// Tiga izin per orang yang direkam, semuanya mati secara bawaan (proposal 4.3, Gambar L6).
// Penjelasan menyebut penyedia, negara, dan tujuan sesuai Pasal 56 UU 27/2022 tentang transfer data ke luar negeri.

export const DASAR_HUKUM = "Pasal 56 Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi";

export const PENJELASAN_IZIN = [
  {
    kunci: "izin_nilai" as const,
    judul: "Rekaman saya boleh dinilai",
    isi: "Audio satu menit dikirim ke layanan pengubah suara menjadi teks, lalu transkrip yang namanya sudah disamarkan dikirim ke model bahasa untuk menyusun umpan balik.",
    penyedia: "ElevenLabs (cadangan Deepgram), lalu OpenAI",
    negara: "Amerika Serikat",
    wajib_untuk: "Rekam 1 Menit dan umpan balik",
  },
  {
    kunci: "izin_dengar" as const,
    judul: "Terapis boleh mendengar rekaman saya selama 7 hari",
    isi: "Audio disimpan di server privat. Hanya terapis anak ini yang bisa memutarnya, tanpa unduhan, dan setiap pemutaran dicatat. Setelah 7 hari audio dihapus. Bila izin ini mati, audio dihapus segera setelah dinilai.",
    penyedia: "Supabase",
    negara: "Singapura",
    wajib_untuk: "Terapis memutar rekaman di kartu anak",
  },
  {
    kunci: "izin_klip" as const,
    judul: "Pengelola keluarga boleh memutar Momen anak dari rekaman saya",
    isi: "Klip lima detik saat anak bersuara disimpan di ponsel keluarga, tidak di server.",
    penyedia: "Ponsel keluarga",
    negara: "Indonesia (di perangkat)",
    wajib_untuk: "Momen anak di Keluarga minggu ini",
  },
];

/** Hapus semua audio milik satu anggota dari bucket dan kosongkan path_audio. Mengembalikan jumlah berkas. */
export async function hapusAudioAnggota(anggotaId: string): Promise<number> {
  const { data } = await db().from("rekaman").select("id, path_audio").eq("anggota_id", anggotaId).not("path_audio", "is", null);
  const path = (data ?? []).map((r) => r.path_audio as string);
  if (path.length === 0) return 0;
  await db().storage.from("audio").remove(path);
  await db().from("rekaman").update({ path_audio: null, audio_kedaluwarsa: null }).in("id", (data ?? []).map((r) => r.id));
  return path.length;
}
