import { API } from "@/lib/kontrak/api";
import { denganAkses } from "@/lib/server/akses";
import { bacaBody } from "@/lib/server/respons";
import { db } from "@/lib/server/supabase";
import { tanggalWib } from "@/lib/server/waktu";
import { tandaRegresi } from "@/lib/status/aturan";
import { evaluasiStatus } from "@/lib/status/evaluasi";
import { ekstrakUcapanAnak } from "@/lib/ai/ekstrak";
import { anakRingkas } from "@/lib/keluarga/anggota";

// O9 Catatan malam dan O8 Ceritakan sendiri. Pesan untuk terapis ikut masuk ke Pesan keluarga beserta konteksnya.
// Setelah disimpan, status anak dievaluasi ulang; regresi langsung menaikkan ke Bahas minggu ini.

function tanggalPendek(tgl: string) {
  return new Date(`${tgl}T00:00:00Z`).toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });
}

export const POST = denganAkses(["anggota"], async (req, { saya }) => {
  const body = await bacaBody(req, API.laporan.request);
  if (body instanceof Response) return body;
  const a = saya.anggota;
  const tanggal = tanggalWib();

  const catatan = body.jenis === "catatan_malam" ? body.isi.catatan : body.isi.cerita;
  const regresi = body.jenis === "catatan_malam" ? body.isi.regresi || tandaRegresi(catatan) : tandaRegresi(catatan);
  // Kata baru = yang dipilih/diketik keluarga + yang diucapkan anak menurut catatan bebas (A4.3, K12).
  // Catatan regresi menyebut kata yang hilang, bukan yang diucapkan, jadi tidak diekstrak.
  const diekstrak = body.jenis === "catatan_malam" && catatan.trim() && !regresi ? await ekstrakUcapanAnak(catatan, (await anakRingkas(a.anak_id)).nama) : [];
  const kataBaru = body.jenis === "catatan_malam" ? [...new Set([...body.isi.kata_baru, ...diekstrak].map((k) => k.toLowerCase()))] : [];

  const { data: laporan, error } = await db()
    .from("laporan_keluarga")
    .insert({
      anggota_id: a.id,
      anak_id: a.anak_id,
      jenis: body.jenis,
      tanggal,
      kata_baru: kataBaru,
      kondisi: body.jenis === "catatan_malam" ? body.isi.kondisi : null,
      regresi,
      lebih_sedikit_bersuara: body.jenis === "catatan_malam" ? body.isi.lebih_sedikit_bersuara : false,
      isi: { ...body.isi, ...(body.jenis === "catatan_malam" ? { regresi } : {}) },
    })
    .select("id")
    .single();
  if (error) throw error;

  const pesan = body.isi.pesan_untuk_terapis?.trim();
  if (pesan) {
    const konteks = `${body.jenis === "catatan_malam" ? "Catatan malam" : "Ceritakan sendiri"} ${tanggalPendek(tanggal)}`;
    await db().from("pesan").insert({ anak_id: a.anak_id, pengirim_anggota: a.id, isi: pesan, konteks });
  }

  const naik = await evaluasiStatus(a.anak_id);
  const { data: terapis } = await db().from("anak").select("terapis:terapis_id (nama)").eq("id", a.anak_id).single();
  const t = terapis?.terapis as { nama: string } | { nama: string }[] | null | undefined;
  const namaTerapis = (Array.isArray(t) ? t[0]?.nama : t?.nama) ?? "Terapis";

  const terimaKasih = body.jenis === "catatan_malam" ? "Catatan malam tersimpan. Terima kasih." : "Cerita Anda tersimpan dan ikut dihitung sebagai hari aktif.";
  return Response.json({
    id: laporan.id,
    pesan: naik ? `${terimaKasih} ${namaTerapis} sudah diberi tahu dan akan membahasnya di sesi berikutnya.` : terimaKasih,
    terapis_diberi_tahu: !!naik,
  });
});
