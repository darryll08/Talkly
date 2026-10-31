import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono, Baloo_2 } from "next/font/google";
import { DaftarServiceWorker } from "@/components/daftar-service-worker";
import "./globals.css";

const geistSans = Plus_Jakarta_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Huruf judul dan angka besar: bulat dan ceria, isi tetap Plus Jakarta Sans.
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Talkly",
  description: "Latihan bicara di rumah dari terapis anak Anda.",
  applicationName: "Talkly",
  appleWebApp: { capable: true, title: "Talkly", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#0e5a4b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} ${baloo.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {children}
        <DaftarServiceWorker />
      </body>
    </html>
  );
}
