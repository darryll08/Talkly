"use client";

// useData(): memuat satu endpoint GET lewat panggil(). Saat 401, ke /keluar: cookie basi dihapus lalu ke halaman masuk.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { panggil, GalatApi, pesanDari, type Endpoint } from "./panggil";

type Res<E extends Endpoint> = E["response"] extends z.ZodType ? z.output<E["response"]> : null;
type Req<E extends Endpoint> = E["request"] extends z.ZodType ? z.input<E["request"]> : undefined;

export function useData<E extends Endpoint>(
  endpoint: E,
  data?: Req<E>,
  { masuk = "/keluar", aktif = true, simpanLokal }: { masuk?: string; aktif?: boolean; simpanLokal?: string } = {},
) {
  const router = useRouter();
  const [hasil, setHasil] = useState<{ data: Res<E> | null; galat: string | null; status: number | null; dariCache: boolean }>({
    data: null,
    galat: null,
    status: null,
    dariCache: false,
  });
  const [versi, setVersi] = useState(0);
  const kunci = JSON.stringify(data ?? null);

  useEffect(() => {
    if (!aktif) return;
    let batal = false;
    panggil(endpoint, JSON.parse(kunci) ?? undefined)
      .then((d) => {
        if (batal) return;
        setHasil({ data: d, galat: null, status: 200, dariCache: false });
        if (simpanLokal) {
          try {
            localStorage.setItem(`talkly:cache:${simpanLokal}`, JSON.stringify(d));
          } catch {}
        }
      })
      .catch((e) => {
        if (batal) return;
        if (e instanceof GalatApi && e.status === 401) {
          router.replace(masuk);
          return;
        }
        const status = e instanceof GalatApi ? e.status : null;
        // Tanpa sinyal: tampilkan data terakhir yang tersimpan di ponsel.
        if (status === 0 && simpanLokal) {
          try {
            const lama = localStorage.getItem(`talkly:cache:${simpanLokal}`);
            if (lama) {
              setHasil({ data: JSON.parse(lama), galat: pesanDari(e), status, dariCache: true });
              return;
            }
          } catch {}
        }
        setHasil((lama) => ({ data: lama.data, galat: pesanDari(e), status, dariCache: false }));
      });
    return () => {
      batal = true;
    };
  }, [endpoint, kunci, versi, aktif, masuk, router, simpanLokal]);

  const muatUlang = useCallback(() => setVersi((v) => v + 1), []);
  const setData = useCallback((d: Res<E>) => setHasil({ data: d, galat: null, status: 200, dariCache: false }), []);
  return { ...hasil, memuat: !hasil.data && !hasil.galat, muatUlang, setData };
}
