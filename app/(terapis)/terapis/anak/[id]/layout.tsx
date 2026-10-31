import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Memuat } from "@/components/memuat";
import { MenuAnak } from "@/components/terapis/menu-anak";
import { tombolTeks } from "@/lib/gaya";

export default async function LayoutAnak({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
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
