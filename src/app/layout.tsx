import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegistrar from "@/components/PwaRegistrar";

export const viewport: Viewport = {
  themeColor: "#0172D4",
};

export const metadata: Metadata = {
  title: "Lava Já Smart | Carwash Lava Já",
  description:
    "Consulte serviços, faça a sua pré-marcação e acompanhe o atendimento do carwash Lava Já.",
  applicationName: "Lava Já Smart",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/lava-ja-pwa.svg", type: "image/svg+xml" }, { url: "/icons/lava-ja-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-MZ">
      <body><PwaRegistrar />{children}</body>
    </html>
  );
}
