import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const script = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");
type AssetCache = { put: (request: Request, response: Response) => Promise<void>; addAll: (urls: string[]) => Promise<void> };
function worker(search = "", open: Promise<AssetCache> = Promise.resolve({ put: vi.fn().mockResolvedValue(undefined), addAll: vi.fn().mockResolvedValue(undefined) })) {
  const listeners: Record<string, (event: { request: Request; respondWith: (response: Promise<Response>) => void; waitUntil: (promise: Promise<unknown>) => void }) => void> = {};
  const caches = { match: vi.fn().mockResolvedValue(undefined), open: vi.fn(() => open), keys: vi.fn().mockResolvedValue(["shirley-static-v1", "other-app-cache"]), delete: vi.fn().mockResolvedValue(true) };
  const response = new Response("asset");
  Object.defineProperty(response, "type", { value: "basic" });
  const self = { location: new URL(`https://frontend.example.invalid/sw.js${search}`), addEventListener: (name: string, handler: (typeof listeners)[string]) => { listeners[name] = handler; }, skipWaiting: vi.fn().mockResolvedValue(undefined), clients: { claim: vi.fn().mockResolvedValue(undefined) } };
  runInNewContext(script, { self, caches, URL, fetch: vi.fn().mockResolvedValue(response), Promise });
  return { listeners, caches, response, self };
}

describe("cache do service worker", () => {
  it("clona antes de devolver a resposta, mesmo com abertura lenta do cache", async () => {
    const put = vi.fn(async (_request: Request, response: Response) => { expect(await response.text()).toBe("asset"); });
    let release!: (cache: AssetCache) => void;
    const gate = new Promise<AssetCache>((resolve) => { release = resolve; });
    const context = worker("", gate);
    const tasks: Promise<unknown>[] = [];
    let served!: Promise<Response>;
    context.listeners.fetch({ request: new Request("https://frontend.example.invalid/_next/static/chunks/asset.js"), respondWith: (response) => { served = response; }, waitUntil: (promise) => { tasks.push(promise); } });
    const response = await served;
    expect(tasks).toHaveLength(1);
    expect(await response.text()).toBe("asset");
    release({ put, addAll: vi.fn().mockResolvedValue(undefined) });
    await Promise.all(tasks);
    expect(put).toHaveBeenCalledOnce();
  });
  it("não intercepta HMR nem módulos em desenvolvimento", () => {
    const context = worker("?development=1");
    const respondWith = vi.fn();
    context.listeners.fetch({ request: new Request("https://frontend.example.invalid/_next/static/chunks/app.js"), respondWith, waitUntil: vi.fn() });
    expect(respondWith).not.toHaveBeenCalled();
  });
  it.each(["/api/v1/auth/me", "/admin", "/api/v1/admin/dashboard"])("não armazena sessão ou dados privados: %s", (path) => {
    const context = worker();
    const respondWith = vi.fn();
    context.listeners.fetch({ request: new Request(`https://frontend.example.invalid${path}`), respondWith, waitUntil: vi.fn() });
    expect(respondWith).not.toHaveBeenCalled();
  });
  it("limpa apenas caches antigos da Shirley", async () => {
    const context = worker();
    const tasks: Promise<unknown>[] = [];
    context.listeners.activate({ request: new Request("https://frontend.example.invalid/"), respondWith: vi.fn(), waitUntil: (promise) => { tasks.push(promise); } });
    await Promise.all(tasks);
    expect(context.caches.delete).toHaveBeenCalledWith("shirley-static-v1");
    expect(context.caches.delete).not.toHaveBeenCalledWith("other-app-cache");
  });
});
