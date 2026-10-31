import { semuaAkun } from "@/lib/admin/akun";
import { denganAkses } from "@/lib/server/akses";
import { db } from "@/lib/server/supabase";

// A1: semua klinik dan terapis dengan jumlah anak, untuk admin Talkly.

export const GET = denganAkses(["admin"], async (_req, { saya }) => {
  const [klinik, terapis, anak, keluarga, akun] = await Promise.all([
    db().from("klinik").select("id, nama, data_contoh").order("dibuat"),
    db().from("terapis").select("id, nama, klinik_id, dibuat").order("dibuat", { ascending: false }),
    db().from("anak").select("klinik_id, terapis_id"),
    db().from("anggota").select("anak_id").eq("aktif", true),
    semuaAkun(),
  ]);
  for (const r of [klinik, terapis, anak, keluarga]) if (r.error) throw r.error;

  const email = new Map(akun.map((u) => [u.id, u.email ?? ""]));
  const daftarKlinik = new Map((klinik.data ?? []).map((k) => [k.id as string, k]));
  const hitung = (kunci: "klinik_id" | "terapis_id", id: string) => (anak.data ?? []).filter((a) => a[kunci] === id).length;

  return Response.json({
    admin: { nama: saya.admin.nama, email: saya.admin.email },
    total: {
      klinik: klinik.data?.length ?? 0,
      terapis: terapis.data?.length ?? 0,
      anak: anak.data?.length ?? 0,
      keluarga: new Set((keluarga.data ?? []).map((a) => a.anak_id)).size,
    },
    klinik: (klinik.data ?? []).map((k) => ({
      id: k.id,
      nama: k.nama,
      data_contoh: k.data_contoh,
      terapis: (terapis.data ?? []).filter((t) => t.klinik_id === k.id).length,
      anak: hitung("klinik_id", k.id),
    })),
    terapis: (terapis.data ?? []).map((t) => {
      const k = daftarKlinik.get(t.klinik_id);
      return {
        id: t.id,
        nama: t.nama,
        email: email.get(t.id) ?? "",
        klinik_id: t.klinik_id,
        klinik: k?.nama ?? "",
        anak: hitung("terapis_id", t.id),
        data_contoh: k?.data_contoh ?? false,
        dibuat: new Date(t.dibuat).toISOString().replace("Z", "+00:00"),
      };
    }),
  });
});
