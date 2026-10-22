import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lava Já Smart | Carwash Lava Já",
  description:
    "Consulte serviços, faça a sua pré-marcação e acompanhe o atendimento do carwash Lava Já.",
  applicationName: "Lava Já Smart",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-MZ">
      <body>{children}</body>
    </html>
  );
}
