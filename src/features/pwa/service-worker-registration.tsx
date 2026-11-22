"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const script = process.env.NODE_ENV === "production" ? "/sw.js" : "/sw.js?development=1";
      navigator.serviceWorker.register(script, { updateViaCache: "none" }).catch(() => undefined);
    }
  }, []);
  return null;
}

