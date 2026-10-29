"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useAdminRealtime(enabled = true) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const seen = useRef(new Set<string>());
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const origin = new URL(API_URL).origin;
    const socket = io(`${origin}/admin`, { withCredentials: true, transports: ["websocket", "polling"] });
    socketRef.current = socket;
    const reconcile = () => { setConnected(true); void queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); void queryClient.invalidateQueries({ queryKey: queryKeys.notifications }); void queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotifications }); };
    const disconnected = () => setConnected(false);
    const event = (payload: { event_id?: string; pedido_id?: string }) => {
      if (payload.event_id && seen.current.has(payload.event_id)) return;
      if (payload.event_id) { seen.current.add(payload.event_id); if (seen.current.size > 100) seen.current.delete(seen.current.values().next().value as string); }
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      if (payload.pedido_id) void queryClient.invalidateQueries({ queryKey: queryKeys.order(String(payload.pedido_id)) });
    };
    socket.on("connect", reconcile); socket.on("disconnect", disconnected); socket.on("connect_error", disconnected);
    socket.on("novo_pedido_recebido", event); socket.on("pedido_atualizado", event); socket.on("loja_atualizada", reconcile); socket.on("notificacao_recebida", event);
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [enabled, queryClient]);
  return { connected: enabled && connected };
}

