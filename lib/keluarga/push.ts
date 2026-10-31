import { after } from "next/server";
import webpush from "web-push";
import { db } from "@/lib/server/supabase";

// Web Push ke ponsel keluarga. Langganan yang dibalas 404/410 oleh layanan push dihapus.
// Kegagalan kirim tidak pernah menggagalkan aksi utama (menyetujui rencana, membalas pesan, dst.).

export type IsiNotifikasi = { judul: string; isi: string; url: string };

let siap = false;
function pasang() {
  if (siap) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails("https://talkly-orcin.vercel.app", pub, priv);
  siap = true;
  return true;
}

/** Kirim ke semua langganan anggota tertentu. Mengembalikan jumlah notifikasi terkirim. */
export async function kirimKeAnggota(anggotaIds: string[], n: IsiNotifikasi): Promise<number> {
  if (anggotaIds.length === 0 || !pasang()) return 0;
  const { data } = await db().from("langganan_push").select("endpoint, langganan").in("anggota_id", anggotaIds);
  let terkirim = 0;
  await Promise.all(
    (data ?? []).map(async (l) => {
      try {
        await webpush.sendNotification(l.langganan as webpush.PushSubscription, JSON.stringify({ title: n.judul, body: n.isi, url: n.url }), { TTL: 86_400 });
        terkirim++;
      } catch (e) {
        const kode = (e as { statusCode?: number }).statusCode;
        if (kode === 404 || kode === 410) await db().from("langganan_push").delete().eq("endpoint", l.endpoint);
        else console.error("push gagal", kode);
      }
    }),
  );
  return terkirim;
}

/** Semua anggota aktif satu anak, kecuali `kecuali`. */
export async function anggotaKeluarga(anakId: string, opsi: { kecuali?: string; hanyaPengelola?: boolean } = {}) {
  let q = db().from("anggota").select("id").eq("anak_id", anakId).eq("aktif", true);
  if (opsi.hanyaPengelola) q = q.eq("pengelola_keluarga", true);
  const { data } = await q;
  return (data ?? []).map((a) => a.id as string).filter((id) => id !== opsi.kecuali);
}

/**
 * Kirim setelah respons terkirim (after(), supaya tidak terpotong di Vercel) dan tanpa melempar galat.
 * Di luar konteks permintaan (skrip uji), pengiriman tetap berjalan biasa.
 */
export function kirimDiam(kerja: Promise<unknown>) {
  const aman = kerja.catch((e) => console.error("notifikasi", e));
  try {
    after(aman);
  } catch {
    void aman;
  }
}
