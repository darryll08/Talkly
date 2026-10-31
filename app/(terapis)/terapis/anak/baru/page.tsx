import { Suspense } from "react";
import { Memuat } from "@/components/memuat";
import { ProgramBaru } from "@/components/terapis/program";
export default function Halaman() { return <Suspense fallback={<Memuat />}><ProgramBaru /></Suspense>; }
