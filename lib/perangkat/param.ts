"use client";

import { useParams } from "next/navigation";

/**
 * Parameter rute yang aman dibaca. Saat pindah halaman dari dalam aplikasi, Next 16 sempat memberi nilai sementara
 * berisi "%%" yang membuat decodeURIComponent melempar "URI malformed" dan halaman jatuh ke layar galat.
 * null = nilai belum siap; tampilkan layar memuat dan jangan memanggil API dulu.
 */
export function useParamRute(nama: string): string | null {
  const nilai = useParams<Record<string, string>>()[nama];
  if (!nilai || nilai.includes("%%")) return null;
  try {
    return decodeURIComponent(nilai);
  } catch {
    return null;
  }
}
