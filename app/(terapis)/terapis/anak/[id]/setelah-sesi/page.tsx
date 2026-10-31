import { Suspense } from "react";
import { Memuat } from "@/components/memuat";
import { SetelahSesi } from "@/components/terapis/setelah-sesi";
export default function Halaman() { return <Suspense fallback={<Memuat />}><SetelahSesi /></Suspense>; }
