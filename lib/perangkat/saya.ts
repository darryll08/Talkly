"use client";

// useSaya(): cache GET /api/saya untuk seluruh layar orang tua. belumMasuk = true bila server membalas 401.

import { useEffect, useSyncExternalStore } from "react";
import type { z } from "zod";
import { panggil, GalatApi, pesanDari } from "./panggil";
import { API } from "@/lib/kontrak/api";

export type Saya = z.output<NonNullable<(typeof API)["saya"]["response"]>>;

type Keadaan = { data: Saya | null; galat: string | null; belumMasuk: boolean; memuat: boolean };

let keadaan: Keadaan = { data: null, galat: null, belumMasuk: false, memuat: false };
let janji: Promise<void> | null = null;
let sudahDimuat = false;
const pendengar = new Set<() => void>();

function ubah(baru: Partial<Keadaan>) {
  keadaan = { ...keadaan, ...baru };
  pendengar.forEach((f) => f());
}

export function muatSaya(paksa = false): Promise<void> {
  if (janji && !paksa) return janji;
  if (sudahDimuat && !paksa) return Promise.resolve();
  ubah({ memuat: true, galat: null });
  janji = panggil(API.saya)
    .then((data) => {
      sudahDimuat = true;
      ubah({ data, belumMasuk: false, memuat: false });
    })
    .catch((e) => {
      if (e instanceof GalatApi && e.status === 401) ubah({ data: null, belumMasuk: true, memuat: false });
      else ubah({ galat: pesanDari(e), memuat: false });
    })
    .finally(() => {
      janji = null;
    });
  return janji;
}

/** Dipanggil setelah keluar atau ganti persona demo. */
export function lupakanSaya() {
  sudahDimuat = false;
  ubah({ data: null, belumMasuk: false, galat: null });
}

const AWAL: Keadaan = { data: null, galat: null, belumMasuk: false, memuat: true };

export function useSaya() {
  const k = useSyncExternalStore(
    (f) => {
      pendengar.add(f);
      return () => pendengar.delete(f);
    },
    () => keadaan,
    () => AWAL,
  );
  useEffect(() => {
    muatSaya();
  }, []);
  return { ...k, memuat: k.memuat || (!k.data && !k.galat && !k.belumMasuk), muatSaya };
}
