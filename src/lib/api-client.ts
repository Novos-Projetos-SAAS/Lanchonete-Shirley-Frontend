import type { ErrorEnvelope, SuccessEnvelope } from "@/types/api";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api/v1").replace(/\/$/, "");
const DEFAULT_TIMEOUT = 15_000;
export const SESSION_EXPIRED_EVENT = "shirley:session-expired";

let csrfToken: string | null = null;
let csrfPromise: Promise<string> | null = null;
let refreshPromise: Promise<boolean> | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly requestId?: string,
    public readonly details?: ErrorEnvelope["details"],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeout?: number;
  csrf?: boolean;
  retryAuth?: boolean;
  raw?: boolean;
}

function isBodyInit(value: unknown): value is BodyInit {
  return typeof value === "string" || value instanceof FormData || value instanceof Blob || value instanceof URLSearchParams;
}

async function parseError(response: Response): Promise<ApiError> {
  let payload: Partial<ErrorEnvelope> = {};
  try {
    payload = (await response.json()) as ErrorEnvelope;
  } catch {
    // Respostas de infraestrutura podem não ser JSON.
  }
  const fallbackByStatus: Record<number, string> = {
    400: "Não foi possível processar os dados enviados.", 401: "Sua sessão expirou. Entre novamente.",
    403: "Você não tem permissão para realizar esta ação.", 404: "O registro solicitado não foi encontrado.",
    409: "A operação conflita com o estado atual do registro.", 413: "O conteúdo enviado excede o limite permitido.",
    422: "Revise os campos informados.", 429: "Muitas tentativas. Aguarde um momento e tente novamente.",
    500: "Ocorreu uma falha no servidor. Tente novamente.", 502: "O serviço está temporariamente indisponível.",
    503: "O serviço está temporariamente indisponível.", 504: "O serviço demorou para responder. Tente novamente.",
  };
  const message = typeof payload.message === "string" && payload.message.trim() ? payload.message.trim() : (fallbackByStatus[response.status] || (response.status >= 500 ? fallbackByStatus[500] : "Não foi possível concluir a solicitação."));
  const code = typeof payload.code === "string" && /^[A-Z0-9_]{2,100}$/.test(payload.code) ? payload.code : `HTTP_${response.status}`;
  const requestId = typeof payload.request_id === "string" ? payload.request_id.slice(0, 100) : undefined;
  const details = Array.isArray(payload.details) ? payload.details.filter((detail) => detail && typeof detail.path === "string" && typeof detail.message === "string").map((detail) => ({ path: detail.path!.slice(0, 200), message: detail.message!.slice(0, 500) })) : undefined;
  return new ApiError(
    message,
    response.status,
    code,
    requestId,
    details,
  );
}

async function fetchWithTimeout(path: string, options: ApiRequestOptions = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), options.timeout ?? DEFAULT_TIMEOUT);
  const headers = new Headers(options.headers);
  const body = options.body == null ? undefined : isBodyInit(options.body) ? options.body : JSON.stringify(options.body);
  if (body && !(body instanceof FormData) && !headers.has("content-type")) headers.set("content-type", "application/json");
  try {
    return await fetch(`${API_URL}${path}`, {
      ...options,
      body,
      headers,
      credentials: "include",
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("O servidor demorou para responder. Tente novamente.", 408, "REQUEST_TIMEOUT");
    }
    throw new ApiError("Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.", 0, "NETWORK_ERROR");
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function getCsrfToken(force = false): Promise<string> {
  if (csrfToken && !force) return csrfToken;
  if (!csrfPromise || force) {
    csrfPromise = (async () => {
      const response = await fetchWithTimeout("/auth/csrf", { method: "GET", retryAuth: false });
      if (!response.ok) throw await parseError(response);
      const envelope = (await response.json()) as SuccessEnvelope<{ csrf_token: string }>;
      csrfToken = envelope.data.csrf_token;
      return csrfToken;
    })().finally(() => {
      csrfPromise = null;
    });
  }
  return csrfPromise;
}

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const token = await getCsrfToken();
        const response = await fetchWithTimeout("/auth/refresh", {
          method: "POST",
          headers: { "x-csrf-token": token },
          retryAuth: false,
        });
        if (!response.ok) {
          csrfToken = null;
          return false;
        }
        return true;
      } catch {
        csrfToken = null;
        return false;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function notifySessionExpired() {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

function canRefreshPath(path: string) {
  return !["/auth/login", "/auth/refresh", "/auth/logout", "/auth/logout-all", "/auth/csrf"].includes(path);
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers);
  if (options.csrf && !["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers.set("x-csrf-token", await getCsrfToken());
  }

  let response = await fetchWithTimeout(path, { ...options, headers });
  const canRefresh = options.retryAuth !== false && response.status === 401 && canRefreshPath(path);
  if (canRefresh) {
    if (await refreshSession()) {
      if (options.csrf) headers.set("x-csrf-token", await getCsrfToken());
      response = await fetchWithTimeout(path, { ...options, headers, retryAuth: false });
      if (response.status === 401) notifySessionExpired();
    } else {
      notifySessionExpired();
    }
  }
  if (!response.ok) throw await parseError(response);
  if (options.raw) return response as T;
  if (response.status === 204) return null as T;
  const envelope = (await response.json()) as SuccessEnvelope<T>;
  return envelope.data;
}

export function clearCsrfToken() {
  csrfToken = null;
}

export function isVersionConflict(error: unknown) {
  return error instanceof ApiError && error.status === 409 && error.code === "ORDER_VERSION_CONFLICT";
}

export { API_URL };

