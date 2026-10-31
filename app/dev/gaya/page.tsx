import { notFound } from "next/navigation";
import { Contoh } from "./contoh";

export const metadata = { title: "Sistem tampilan · Talkly" };

// Halaman pemeriksa sistem tampilan (B0.3). Hanya muncul saat DEMO=1.
export default function HalamanGaya() {
  if (process.env.DEMO !== "1" && process.env.NEXT_PUBLIC_DEMO !== "1") notFound();
  return <Contoh />;
}
