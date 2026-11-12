import type { OrderSummary } from "@/types/domain";

export const RECENT_ORDERS_KEY = "shirley.recent-orders.v1";
export const RECENT_ORDERS_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const RECENT_ORDERS_LIMIT = 10;

export interface RecentOrderReference {
  code: string;
  orderId?: string;
  createdAt: string;
  savedAt: string;
}

interface StoredRecentOrders {
  version: 1;
  items: RecentOrderReference[];
}

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage; } catch { return null; }
}

function validReference(value: unknown): value is RecentOrderReference {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<RecentOrderReference>;
  return typeof item.code === "string" && /^[a-f0-9]{32}$/.test(item.code)
    && typeof item.createdAt === "string" && Number.isFinite(Date.parse(item.createdAt))
    && typeof item.savedAt === "string" && Number.isFinite(Date.parse(item.savedAt))
    && (item.orderId === undefined || (typeof item.orderId === "string" && /^\d{1,19}$/.test(item.orderId)));
}

function persist(items: RecentOrderReference[]) {
  const target = storage();
  if (!target) return false;
  try {
    target.setItem(RECENT_ORDERS_KEY, JSON.stringify({ version: 1, items } satisfies StoredRecentOrders));
    return true;
  } catch { return false; }
}

export function readRecentOrders(now = Date.now()) {
  const target = storage();
  if (!target) return [];
  try {
    const raw = target.getItem(RECENT_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<StoredRecentOrders>;
    if (parsed.version !== 1 || !Array.isArray(parsed.items)) throw new Error("invalid recent order storage");
    const items = parsed.items.filter(validReference)
      .filter((item) => now - Date.parse(item.savedAt) <= RECENT_ORDERS_TTL_MS)
      .sort((left, right) => Date.parse(right.savedAt) - Date.parse(left.savedAt))
      .slice(0, RECENT_ORDERS_LIMIT);
    if (items.length !== parsed.items.length) persist(items);
    return items;
  } catch {
    try { target.removeItem(RECENT_ORDERS_KEY); } catch { /* armazenamento indisponível */ }
    return [];
  }
}

export function rememberRecentOrder(order: Partial<OrderSummary>, now = new Date()) {
  const code = order.codigo_acompanhamento?.trim().toLowerCase();
  if (!code || !/^[a-f0-9]{32}$/.test(code)) return false;
  const orderId = order.pedido_id ?? order.id;
  const item: RecentOrderReference = {
    code,
    ...(orderId != null && /^\d{1,19}$/.test(String(orderId)) ? { orderId: String(orderId) } : {}),
    createdAt: order.criado_em && Number.isFinite(Date.parse(order.criado_em)) ? order.criado_em : now.toISOString(),
    savedAt: now.toISOString(),
  };
  const current = readRecentOrders(now.getTime()).filter((entry) => entry.code !== code);
  return persist([item, ...current].slice(0, RECENT_ORDERS_LIMIT));
}

export function clearRecentOrders() {
  const target = storage();
  if (!target) return false;
  try { target.removeItem(RECENT_ORDERS_KEY); return true; } catch { return false; }
}
