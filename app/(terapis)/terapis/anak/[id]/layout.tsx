import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Memuat } from "@/components/memuat";
import { MenuAnak } from "@/components/terapis/menu-anak";
import { tombolTeks } from "@/lib/gaya";

type Props = { children: ReactNode; params: Promise<{ id: string }> };

export default function LayoutAnak(props: Props) {
  return (
    <Suspense fallback={<Memuat label="Memuat halaman anak" />}>
      <IsiLayoutAnak {...props} />
    </Suspense>
  );
}

async function IsiLayoutAnak({ children, params }: Props) {
  const { id } = await params;

  return (
    <div className="min-w-0 space-y-6">
      <Link href="/terapis" className={tombolTeks}>
        ‹ Minggu ini
      </Link>
      <Suspense fallback={<Memuat label="Memuat menu anak" />}>
        <MenuAnak anakId={id} />
      </Suspense>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
