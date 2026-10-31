import { type NextRequest } from "next/server";
import { hapusSemuaSesi } from "@/lib/server/sesi";

// /keluar: hapus semua cookie sesi (juga penanda mode data contoh), lalu ke halaman masuk.
// GET dipakai saat server membalas 401 agar sesi basi tidak membuat proxy berputar balik.

async function keluar(req: NextRequest) {
  await hapusSemuaSesi();
  const tujuan = new URL("/masuk", req.url);
  const sebagai = req.nextUrl.searchParams.get("sebagai");
  if (sebagai === "terapis" || sebagai === "admin") tujuan.searchParams.set("sebagai", sebagai);
  if (req.method === "POST" || req.nextUrl.searchParams.has("selesai")) tujuan.searchParams.set("keluar", "1");
  return Response.redirect(tujuan, 303);
}

export const GET = keluar;
export const POST = keluar;
