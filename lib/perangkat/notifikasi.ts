"use client";

// Web Push: izin → pushManager.subscribe dengan VAPID publik → kirim langganan ke server (POST /api/push).
// Pengiriman ke server disuntikkan pemanggil lewat `kirim` agar semua panggilan /api tetap lewat panggil().

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export type KeadaanNotifikasi = "tidak-didukung" | "ditolak" | "mati" | "aktif";

export function notifikasiDidukung() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function kunciKeUint8(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

async function registrasi() {
  const ada = await navigator.serviceWorker.getRegistration("/");
  if (ada) return ada;
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export async function notifikasiAktif(): Promise<KeadaanNotifikasi> {
  if (!notifikasiDidukung()) return "tidak-didukung";
  if (Notification.permission === "denied") return "ditolak";
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === "granted" ? "aktif" : "mati";
}

export const PESAN_NOTIFIKASI: Record<Exclude<KeadaanNotifikasi, "aktif" | "mati">, string> = {
  "tidak-didukung":
    "Peramban ini belum bisa menerima pengingat. Buka Talkly di Chrome Android dan pasang di layar utama.",
  ditolak:
    "Pengingat diblokir. Di Chrome, ketuk ikon gembok di sebelah alamat situs → Izin → Notifikasi → Izinkan.",
};

export async function aktifkanNotifikasi(kirim: (langganan: PushSubscriptionJSON) => Promise<unknown>): Promise<KeadaanNotifikasi> {
  if (!notifikasiDidukung()) return "tidak-didukung";
  const izin = await Notification.requestPermission();
  if (izin !== "granted") return izin === "denied" ? "ditolak" : "mati";
  if (!VAPID) throw new Error("Kunci VAPID belum dipasang di server.");
  const reg = await registrasi();
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: kunciKeUint8(VAPID) }));
  await kirim(sub.toJSON());
  return "aktif";
}

export async function matikanNotifikasi(): Promise<KeadaanNotifikasi> {
  if (!notifikasiDidukung()) return "tidak-didukung";
  const reg = await navigator.serviceWorker.getRegistration("/");
  await (await reg?.pushManager.getSubscription())?.unsubscribe();
  return "mati";
}

/** Notifikasi uji lokal, tanpa server, untuk memastikan ponsel bisa menampilkan notifikasi. */
export async function notifikasiUji() {
  if (!notifikasiDidukung()) throw new Error(PESAN_NOTIFIKASI["tidak-didukung"]);
  if (Notification.permission !== "granted") {
    const izin = await Notification.requestPermission();
    if (izin !== "granted") throw new Error(PESAN_NOTIFIKASI.ditolak);
  }
  const reg = await registrasi();
  await navigator.serviceWorker.ready;
  await reg.showNotification("Waktunya mandi bebek dengan Raka", {
    body: "Ini notifikasi uji dari Talkly.",
    icon: "/icon-192.png",
    data: { url: "/hari-ini" },
  });
}
