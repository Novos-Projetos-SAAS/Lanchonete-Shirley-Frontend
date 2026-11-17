import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/nunito-sans";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ConnectionBanner } from "@/components/shared/connection-banner";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const description =
  "Hambúrgueres, cachorro-quente, porções e bebidas. Escolha seus favoritos e faça seu pedido online na Lanchonete Shirley.";
const socialTitle = "Lanchonete Shirley | Peça seu lanche online";
const socialImage = "/opengraph-image";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Lanchonete Shirley", template: "%s | Lanchonete Shirley" },
  description,
  applicationName: "Lanchonete Shirley",
  keywords: [
    "Lanchonete Shirley",
    "cardápio online",
    "hambúrguer",
    "cachorro-quente",
    "porções",
    "lanches",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Lanchonete Shirley",
    title: socialTitle,
    description,
    images: [
      {
        url: socialImage,
        width: 1200,
        height: 630,
        alt: "Lanchonete Shirley: hambúrgueres, cachorro-quente, porções e bebidas",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: socialTitle,
    description,
    images: [socialImage],
  },
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
