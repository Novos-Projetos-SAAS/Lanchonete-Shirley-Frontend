import { adminService } from "@/services/admin-service";

export class PushSetupError extends Error {
  constructor(message: string) { super(message); this.name = "PushSetupError"; }
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - base64.length % 4) % 4);
  const value = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(value);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export function pushSupport() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function enablePush() {
  if (!pushSupport()) throw new PushSetupError("Este navegador não oferece Web Push.");
  const config = await adminService.pushConfig();
  const key = config.public_key || config.chave_publica;
  if (!config.habilitado || !key) throw new PushSetupError("As notificações Push ainda não estão configuradas no servidor.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new PushSetupError("A permissão de notificações não foi concedida. Autorize nas configurações do navegador e tente novamente.");
  const registration = await navigator.serviceWorker.ready;
  const current = await registration.pushManager.getSubscription();
  const subscription = current || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) });
  const json = subscription.toJSON();
  await adminService.subscribePush({ endpoint: subscription.endpoint, expirationTime: json.expirationTime ?? null, keys: { p256dh: json.keys?.p256dh || "", auth: json.keys?.auth || "" }, dispositivo_nome: navigator.userAgent.includes("Android") ? "Android" : "Navegador" });
  return subscription;
}

export async function disablePush() {
  if (!pushSupport()) return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return false;
  try { await adminService.unsubscribePush(subscription.endpoint); } finally { await subscription.unsubscribe(); }
  return true;
}

