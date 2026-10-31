import { Suspense } from "react";
import { Memuat } from "@/components/memuat";
import { Ceritakan } from "./ceritakan";

export const metadata = { title: "Ceritakan sendiri · Talkly" };

export default function HalamanCeritakan() {
  return (
    <Suspense fallback={<Memuat />}>
      <Ceritakan />
    </Suspense>
  );
}
