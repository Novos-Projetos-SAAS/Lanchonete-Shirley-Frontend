import { ApiError } from "@/lib/api-client";

export interface FormErrorFeedback {
  message: string;
  fields: Record<string, string>;
  requestId?: string;
}

const STATUS_FALLBACKS: Record<number, string> = {
  0: "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
  400: "Não foi possível processar os dados enviados.",
  401: "Sua sessão expirou. Entre novamente.",
  403: "Você não tem permissão para realizar esta ação.",
  404: "O registro solicitado não foi encontrado.",
  408: "O servidor demorou para responder. Tente novamente.",
  409: "O registro foi alterado ou já existe. Atualize os dados e tente novamente.",
  413: "O conteúdo enviado excede o limite permitido.",
  422: "Revise os campos destacados.",
  429: "Muitas tentativas. Aguarde um momento e tente novamente.",
  500: "Ocorreu uma falha no servidor. Tente novamente.",
  502: "O serviço está temporariamente indisponível. Tente novamente.",
  503: "O serviço está temporariamente indisponível. Tente novamente.",
  504: "O serviço demorou para responder. Tente novamente.",
};

const CODE_FIELDS: Record<string, string> = {
  PRODUCT_PRICE_REQUIRED: "preco_base",
  ACTIVE_CATEGORY_REQUIRED: "categoria_id",
  BREAD_LINK_REQUIRED: "ativo",
  BREAD_PRICE_REQUIRED: "acrescimo",
  FRENCH_BREAD_PRICE_REQUIRED: "acrescimo",
};

export function apiErrorMessage(error: unknown, fallback = "Não foi possível concluir a solicitação.") {
  if (!(error instanceof ApiError)) return fallback;
  const message = error.message.trim();
  return message || STATUS_FALLBACKS[error.status] || (error.status >= 500 ? STATUS_FALLBACKS[500] : fallback);
}

function normalizePath(path: string) {
  return path.replace(/\[(\d+)\]/g, ".$1").replace(/^(body|data)\./, "").replace(/^\.|\.$/g, "");
}

export function toFormError(
  error: unknown,
  options: { fallback?: string; prefix?: string; aliases?: Record<string, string> } = {},
): FormErrorFeedback {
  const apiError = error instanceof ApiError ? error : undefined;
  const fields: Record<string, string> = {};
  for (const detail of apiError?.details ?? []) {
    if (!detail.path || !detail.message) continue;
    const path = normalizePath(detail.path);
    const field = options.aliases?.[path] ?? path;
    if (field && !fields[field]) fields[field] = detail.message;
  }
  const fallbackField = apiError && CODE_FIELDS[apiError.code];
  if (fallbackField && !Object.keys(fields).length) fields[options.aliases?.[fallbackField] ?? fallbackField] = apiErrorMessage(error, options.fallback);
  const message = apiErrorMessage(error, options.fallback);
  return {
    message: options.prefix || message,
    fields,
    requestId: apiError && apiError.status >= 500 ? apiError.requestId : undefined,
  };
}

export function clearFormFieldError(feedback: FormErrorFeedback | null, field: string) {
  if (!feedback?.fields[field]) return feedback;
  const fields = { ...feedback.fields };
  delete fields[field];
  return Object.keys(fields).length ? { ...feedback, fields } : null;
}
