import { NextResponse, type NextRequest } from "next/server";

// Penjaga rute optimistis: hanya melihat ada tidaknya cookie sesi. Tanda tangannya tetap diperiksa di /api.
// Rute keluarga butuh talkly_anggota, rute terapis talkly_terapis, rute admin talkly_admin. Yang sudah masuk tidak perlu
// melihat beranda atau halaman masuk lagi, langsung ke rumah perannya.

const RUTE_ANGGOTA = [
  "/hari-ini",
  "/aktivitas",
  "/catatan-malam",
  "/ceritakan",
  "/hasil",
  "/kartu-benda",
  "/keluarga",
  "/kemajuan",
  "/mulai",
  "/pesan",
  "/profil",
  "/rekam",
];

const cocok = (path: string, awal: string) => path === awal || path.startsWith(awal + "/");

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const anggota = req.cookies.has("talkly_anggota");
  const terapis = req.cookies.has("talkly_terapis");
  const admin = req.cookies.has("talkly_admin");
  const ke = (path: string) => NextResponse.redirect(new URL(path, req.url));

  // Halaman masuk lama terapis: sesi yang ditolak server dibersihkan dulu di /keluar.
  if (pathname === "/terapis/masuk") return ke("/keluar?sebagai=terapis");

  if (pathname === "/" || pathname === "/masuk") {
    if (admin) return ke("/admin");
    if (terapis) return ke("/terapis");
    if (anggota) return ke("/hari-ini");
    return NextResponse.next();
  }

  if (cocok(pathname, "/admin")) return admin ? NextResponse.next() : ke("/masuk?sebagai=admin");
  if (cocok(pathname, "/terapis")) return terapis ? NextResponse.next() : ke("/masuk?sebagai=terapis");
  if (RUTE_ANGGOTA.some((r) => cocok(pathname, r)) && !anggota) return ke("/masuk");

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|keluar|.*\\..*).*)"],
};
