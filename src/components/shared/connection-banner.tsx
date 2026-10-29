"use client";

import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function ConnectionBanner() {
  // navigator.onLine pode iniciar como false em PWAs e redes locais mesmo com a API acessível.
  // Eventos explícitos evitam exibir um bloqueio contraditório enquanto requisições reais funcionam.
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const markOnline = () => setOnline(true);
    const markOffline = () => setOnline(false);
    window.addEventListener("online", markOnline);
    window.addEventListener("offline", markOffline);
    return () => { window.removeEventListener("online", markOnline); window.removeEventListener("offline", markOffline); };
  }, []);
  if (online) return null;
  return <div className="connection-banner" role="status"><WifiOff aria-hidden /> Sem conexão. Não envie pedidos até a internet voltar.</div>;
}

