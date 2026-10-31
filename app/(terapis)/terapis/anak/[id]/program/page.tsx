import { Suspense } from "react";
import { Memuat } from "@/components/memuat";
import { ProgramAnak } from "@/components/terapis/program";
export default function Halaman() { return <Suspense fallback={<Memuat />}><ProgramAnak /></Suspense>; }
