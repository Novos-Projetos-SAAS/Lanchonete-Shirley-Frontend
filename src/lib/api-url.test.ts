import { describe, expect, it } from "vitest";
import { resolveApiConnection } from "./api-url";

describe("API no túnel de homologação", () => {
  const api = "https://protective-ave-assistance-days.trycloudflare.com/api/v1";
  const site = "https://performer-big-zen-remain.trycloudflare.com";
  it("usa a origem do frontend para API e Socket.IO, mantendo o destino fixo no servidor", () => {
    expect(resolveApiConnection(api, site)).toEqual({
      apiBase: "/api/v1",
      rewrites: [
        { source: "/api/v1/:path*", destination: `${api}/:path*` },
        { source: "/socket.io/:path*", destination: "https://protective-ave-assistance-days.trycloudflare.com/socket.io/:path*/" },
      ],
    });
  });
  it("também suporta backend local isolado para provar o proxy sem banco DEV", () => {
    expect(resolveApiConnection("http://127.0.0.1:3347/api/v1", site).apiBase).toBe("/api/v1");
  });
  it.each(["http://localhost:3000", "https://shirley.example.com", undefined])("preserva conexão atual fora do túnel: %s", (origin) => {
    expect(resolveApiConnection(api, origin)).toEqual({ apiBase: api, rewrites: [] });
  });
  it("não cria um proxy recursivo se API e frontend já usam a mesma origem", () => {
    expect(resolveApiConnection(`${site}/api/v1`, site).rewrites).toEqual([]);
  });
  it.each(["https://user:secret@example.invalid/api/v1", "javascript:alert(1)", "/api/v1"])("não cria proxy com destino inválido ou relativo %s", (target) => {
    expect(resolveApiConnection(target, site).rewrites).toEqual([]);
  });
});
