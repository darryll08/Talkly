import { API } from "@/lib/kontrak/api";
import { cekTerapisMenangani, denganAkses } from "@/lib/server/akses";
import { bacaBody, galat } from "@/lib/server/respons";
import { db } from "@/lib/server/supabase";
import { susunDraf } from "@/lib/ai/rencana";
import { muatLaporan, muatRekaman, strategi } from "@/lib/status/agregat";
import { aktivitasRencanaTerbaru } from "@/lib/terapis/program";

// D5 Setelah sesi: catatan terapis, kata baru yang dikonfirmasi, lalu draf rencana minggu depan dari AI.
// Menyimpan catatan berarti status sudah dibahas: status anak kembali ke Lanjut (satu-satunya jalan turun).
// Satu anak hanya punya satu draf aktif (K5): draf lama menjadi "diganti".

export const maxDuration = 30;

type BarisDraf = { id: string; isi: unknown; dasar: unknown; status: string; sumber: string; dibuat: string };
const bentukDraf = (d: BarisDraf | null) => (d ? { id: d.id, isi: d.isi, dasar: d.dasar, status: d.status, sumber: d.sumber, dibuat: d.dibuat } : null);

export const GET = denganAkses(["terapis"], async (req, { saya }) => {
  const anakId = new URL(req.url).searchParams.get("anak") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(anakId)) return galat(400, "Parameter anak belum diisi.");
  const tolak = await cekTerapisMenangani(saya.terapis.id, anakId);
  if (tolak) return tolak;
  const [{ data: catatan }, { data: draf }] = await Promise.all([
    db().from("catatan_sesi").select("id, tanggal, isi, kata_baru_dikonfirmasi").eq("anak_id", anakId).order("dibuat", { ascending: false }).limit(1).maybeSingle(),
    db().from("draf_rencana").select("id, isi, dasar, status, sumber, dibuat").eq("anak_id", anakId).eq("status", "aktif").maybeSingle(),
  ]);
  return Response.json({ catatan: catatan ?? null, draf: bentukDraf(draf as BarisDraf | null) });
});

export const POST = denganAkses(["terapis"], async (req, { saya }) => {
  const body = await bacaBody(req, API.setelahSesiSimpan.request);
  if (body instanceof Response) return body;
  const tolak = await cekTerapisMenangani(saya.terapis.id, body.anak_id);
  if (tolak) return tolak;

  const { data: catatan, error } = await db()
    .from("catatan_sesi")
    .insert({ anak_id: body.anak_id, terapis_id: saya.terapis.id, isi: body.catatan, kata_baru_dikonfirmasi: body.kata_baru_dikonfirmasi })
    .select("id")
    .single();
  if (error) throw error;

  const waktu = new Date().toISOString();
  await db().from("anak").update({ status: "lanjut", status_pemicu: null, status_sejak: waktu }).eq("id", body.anak_id);
  await db().from("riwayat_status").insert({ anak_id: body.anak_id, status: "lanjut", pemicu: "Dibahas di sesi", waktu });

  const [{ data: anak }, { data: anggota }, rekaman, laporan, berjalan] = await Promise.all([
    db().from("anak").select("nama, tahap, kata_target, strategi_fokus, minat, rutinitas").eq("id", body.anak_id).single(),
    db().from("anggota").select("id, nama, peran").eq("anak_id", body.anak_id).eq("aktif", true),
    muatRekaman(body.anak_id, 7),
    muatLaporan(body.anak_id, 7),
    aktivitasRencanaTerbaru(body.anak_id),
  ]);
  const s = strategi(rekaman);
  const ringkasan = [
    `${s.rekaman} rekaman dinilai, ${s.ajakan} ajakan, jeda rata-rata ${s.jeda_rata_s.nilai ?? "-"} detik, giliran per menit ${s.giliran_per_menit.nilai ?? "-"}.`,
    ...laporan.slice(0, 5).map((l) => `${l.tanggal} ${l.laporan.jenis}: ${l.laporan.jenis === "catatan_malam" ? l.laporan.isi.catatan : l.laporan.isi.cerita}`),
  ].join("\n");

  const draf = await susunDraf({
    anak: anak!,
    anggota: anggota ?? [],
    catatan_sesi: body.catatan,
    ringkasan_7_hari: ringkasan,
    rencana_berjalan: berjalan.item,
  });

  await db().from("draf_rencana").update({ status: "diganti" }).eq("anak_id", body.anak_id).eq("status", "aktif");
  const { data: baru, error: e2 } = await db()
    .from("draf_rencana")
    .insert({ anak_id: body.anak_id, catatan_sesi_id: catatan.id, isi: draf.isi, dasar: draf.dasar, sumber: draf.sumber, status: "aktif" })
    .select("id, isi, dasar, status, sumber, dibuat")
    .single();
  if (e2) throw e2;

  return Response.json({ catatan_id: catatan.id, draf: bentukDraf(baru as BarisDraf) });
});
