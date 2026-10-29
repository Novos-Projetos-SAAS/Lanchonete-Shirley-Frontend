const KEY = "shirley.checkout.attempt";

export interface CheckoutAttempt {
  key: string;
  body: string;
  createdAt: string;
}

export function createIdempotencyKey() {
  return crypto.randomUUID();
}

export function getOrCreateAttempt(body: unknown): CheckoutAttempt {
  const serialized = JSON.stringify(body);
  const stored = sessionStorage.getItem(KEY);
  if (stored) {
    const attempt = JSON.parse(stored) as CheckoutAttempt;
    if (attempt.body === serialized) return attempt;
  }
  const attempt = { key: createIdempotencyKey(), body: serialized, createdAt: new Date().toISOString() };
  sessionStorage.setItem(KEY, JSON.stringify(attempt));
  return attempt;
}

export function clearAttempt() {
  sessionStorage.removeItem(KEY);
}

export function readAttempt() {
  const value = sessionStorage.getItem(KEY);
  return value ? (JSON.parse(value) as CheckoutAttempt) : null;
}

