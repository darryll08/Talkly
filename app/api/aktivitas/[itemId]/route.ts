import { denganAkses, type AnggotaSesi } from "@/lib/server/akses";
import { galat, kosong } from "@/lib/server/respons";
import { db } from "@/lib/server/supabase";
import { anakRingkas } from "@/lib/keluarga/anggota";
import { isiKata, kataUntuk, tanggalWib } from "@/lib/keluarga/aktivitas";
import { anggotaKeluarga, kirimDiam, kirimKeAnggota } from "@/lib/keluarga/push";

// O4 Kartu aktivitas (GET) dan "Sudah, tanpa rekam" (POST).

/** Item rencana milik keluarga anggota ini (anak sama, untuk semua atau untuk dirinya). null bila tidak. */
async function itemMilik(itemId: string, a: AnggotaSesi) {
  const { data } = await db()
    .from("rencana_item")
    .select(
      "id, anggota_id, rencana:rencana_id!inner (anak_id), aktivitas:aktivitas_id (judul, rutinitas, langkah, bila_mencoba, bila_belum)",
    )
    .eq("id", itemId)
    .eq("rencana.anak_id", a.anak_id)
    .maybeSingle();
  if (!data || (data.anggota_id && data.anggota_id !== a.id)) return null;
  const akt = (Array.isArray(data.aktivitas) ? data.aktivitas[0] : data.aktivitas) as {
    judul: string;
    rutinitas: string;
    langkah: string[];
    bila_mencoba: string;
    bila_belum: string;
  };
  return { id: data.id as string, ...akt };
}

export const GET = denganAkses(["anggota"], async (_req, { saya, params }) => {
  const item = await itemMilik(params.itemId, saya.anggota);
  if (!item) return galat(404, "Aktivitas ini tidak ditemukan.");
  const anak = await anakRingkas(saya.anggota.anak_id);
  const kata = kataUntuk([item.judul, ...item.langkah].join(" "), item.rutinitas, anak.kata_target);
  const utama = kata[0] ?? "";
  const { data: log } = await db()
    .from("log_aktivitas")
    .select("id")
    .eq("anggota_id", saya.anggota.id)
    .eq("rencana_item_id", item.id)
    .eq("tanggal", tanggalWib())
    .maybeSingle();
  return Response.json({
    item_id: item.id,
    judul: item.judul,
    rutinitas: item.rutinitas,
    kata_target: kata,
    langkah: isiKata(item.langkah, utama),
    bila_mencoba: isiKata(item.bila_mencoba, utama),
    bila_belum: isiKata(item.bila_belum, utama),
    selesai_hari_ini: !!log,
  });
});

export const POST = denganAkses(["anggota"], async (_req, { saya, params }) => {
  const item = await itemMilik(params.itemId, saya.anggota);
  if (!item) return galat(404, "Aktivitas ini tidak ditemukan.");
  const { error } = await db()
    .from("log_aktivitas")
    .upsert(
      { anggota_id: saya.anggota.id, rencana_item_id: item.id, tanggal: tanggalWib(), selesai: true },
      { onConflict: "anggota_id,rencana_item_id,tanggal", ignoreDuplicates: true },
    );
  if (error) throw error;
  // Pengelola keluarga diberi kabar saat pengasuh menyelesaikan aktivitas.
  if (!saya.anggota.pengelola) {
    kirimDiam(
      anggotaKeluarga(saya.anggota.anak_id, { kecuali: saya.anggota.id, hanyaPengelola: true }).then((ids) =>
        kirimKeAnggota(ids, { judul: "Kabar keluarga", isi: `${saya.anggota.nama} sudah mengerjakan "${item.judul}".`, url: "/hari-ini" }),
      ),
    );
  }
  return kosong();
});
