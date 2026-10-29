import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/nunito-sans";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ConnectionBanner } from "@/components/shared/connection-banner";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Lanchonete Shirley", template: "%s | Lanchonete Shirley" },
  description: "Lanches feitos na hora, do jeitinho que você gosta.",
  applicationName: "Lanchonete Shirley",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Shirley" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#a9342b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#conteudo-principal">Pular para o conteúdo</a>
        <Providers>
          <ConnectionBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
