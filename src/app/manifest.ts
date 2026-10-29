import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "Lanchonete Shirley", short_name: "Shirley", description: "Cardápio, pedidos e operação da Lanchonete Shirley.", start_url: "/", display: "standalone", background_color: "#fffaf3", theme_color: "#ad3226", orientation: "any", lang: "pt-BR", categories: ["food", "shopping"], icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }, { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }] };
}

