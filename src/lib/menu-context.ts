const STORAGE_KEY = "shirley.menu.context.v1";
const MAX_CONTEXT_AGE_MS = 30 * 60 * 1000;

export interface MenuContext {
  search: string;
  category: string;
}

interface StoredMenuContext {
  path: string;
  scrollY: number;
  savedAt: number;
}

export function menuContextFromSearch(search: string): MenuContext {
  const params = new URLSearchParams(search);
  return {
    search: (params.get("busca") || "").slice(0, 80),
    category: (params.get("categoria") || "todos").slice(0, 80),
  };
}

export function buildMenuReturnPath({ search, category }: MenuContext) {
  const params = new URLSearchParams();
  const normalizedSearch = search.trim();
  if (normalizedSearch) params.set("busca", normalizedSearch.slice(0, 80));
  if (category && category !== "todos") params.set("categoria", category.slice(0, 80));
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function sanitizeMenuReturnPath(value: string | null | undefined) {
  if (!value || value.length > 500 || !value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://menu.local");
    if (url.origin !== "https://menu.local" || url.pathname !== "/") return "/";
    return buildMenuReturnPath(menuContextFromSearch(url.search));
  } catch {
    return "/";
  }
}

export function buildProductHref(productId: string, returnPath: string) {
  return `/produto/${encodeURIComponent(productId)}?retorno=${encodeURIComponent(sanitizeMenuReturnPath(returnPath))}`;
}

export function saveMenuPosition(path: string, scrollY: number) {
  if (typeof window === "undefined") return;
  const value: StoredMenuContext = {
    path: sanitizeMenuReturnPath(path),
    scrollY: Math.max(0, Math.round(scrollY)),
    savedAt: Date.now(),
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function consumeMenuPosition(path: string) {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as StoredMenuContext;
    if (
      value.path !== sanitizeMenuReturnPath(path)
      || !Number.isFinite(value.scrollY)
      || value.scrollY < 0
      || Date.now() - value.savedAt > MAX_CONTEXT_AGE_MS
    ) return null;
    return value.scrollY;
  } catch {
    return null;
  }
}

