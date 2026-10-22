import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Lava Já Smart",
    short_name: "Lava Já",
    description: "Serviços, pré-marcações e acompanhamento do Lava Já, na Matola.",
    lang: "pt-MZ",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F4FAFF",
    theme_color: "#0172D4",
    icons: [
      { src: "/icons/lava-ja-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/lava-ja-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/lava-ja-pwa.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
