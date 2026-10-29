"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { IconButton } from "./index";

type Tone = "success" | "error" | "info";
interface ToastItem { id: number; title: string; description?: string; tone: Tone }
const ToastContext = createContext<{ toast: (item: Omit<ToastItem, "id">) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const toast = useCallback((item: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current.slice(-2), { ...item, id }]);
    window.setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);
  const value = useMemo(() => ({ toast }), [toast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        {items.map((item) => (
          <div className={`toast toast--${item.tone}`} key={item.id} role="status">
            {item.tone === "error" ? <CircleAlert aria-hidden /> : <CheckCircle2 aria-hidden />}
            <div><strong>{item.title}</strong>{item.description && <p>{item.description}</p>}</div>
            <IconButton label="Fechar aviso" onClick={() => dismiss(item.id)} size="sm"><X aria-hidden /></IconButton>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast precisa estar dentro de ToastProvider.");
  return value;
}

