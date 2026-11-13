"use client";

import { useEffect } from "react";

// Animasi muncul saat digulir (beranda). Elemen ber-kelas `gulir` disembunyikan hanya setelah skrip ini
// berjalan (kelas `gulir-siap` di <html>), jadi tanpa JavaScript isi halaman tetap terlihat.
// Tiap elemen diberi kelas `terlihat` sekali saat masuk layar; gaya dan "kurangi gerak" ada di globals.css.
export function PemicuGulir() {
  useEffect(() => {
    const akar = document.documentElement;
    const elemen = document.querySelectorAll<HTMLElement>(".gulir");
    if (!("IntersectionObserver" in window) || elemen.length === 0) return;

    const pengamat = new IntersectionObserver(
      (entri) => {
        for (const e of entri) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("terlihat");
          pengamat.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
    );
    akar.classList.add("gulir-siap");
    elemen.forEach((el) => pengamat.observe(el));
    return () => {
      pengamat.disconnect();
      akar.classList.remove("gulir-siap");
    };
  }, []);
  return null;
}
