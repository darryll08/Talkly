import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Talkly",
    short_name: "Talkly",
    description: "Latihan bicara di rumah dari terapis anak Anda.",
    start_url: "/hari-ini",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "id",
    theme_color: "#3a9d8f",
    background_color: "#f3f6f5",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
