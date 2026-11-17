export function resolveApiConnection(apiUrl: string, siteUrl?: string) {
  const apiBase = apiUrl.trim().replace(/\/$/, "");
  const direct = { apiBase, rewrites: [] as Array<{ source: string; destination: string }> };
  try {
    const site = new URL(siteUrl ?? "");
    const upstream = new URL(apiBase);
    if (site.protocol !== "https:" || !site.hostname.endsWith(".trycloudflare.com") || site.origin === upstream.origin
      || !["http:", "https:"].includes(upstream.protocol) || upstream.username || upstream.password
      || upstream.search || upstream.hash || upstream.pathname.replace(/\/$/, "") !== "/api/v1") return direct;
    return {
      apiBase: "/api/v1",
      rewrites: [
        { source: "/api/v1/:path*", destination: `${apiBase}/:path*` },
        { source: "/socket.io/:path*", destination: `${upstream.origin}/socket.io/:path*/` },
      ],
    };
  } catch { return direct; }
}
