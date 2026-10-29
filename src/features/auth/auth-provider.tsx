"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest, clearCsrfToken, SESSION_EXPIRED_EVENT } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { SessionUser } from "@/types/domain";

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  refetch: () => Promise<unknown>;
  login: (email: string, senha: string) => Promise<SessionUser>;
  logout: (all?: boolean) => Promise<void>;
  clearLocalSession: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const session = useQuery({
    queryKey: queryKeys.session,
    queryFn: () => apiRequest<SessionUser>("/auth/me"),
    retry: false,
    staleTime: 60_000,
    enabled: pathname.startsWith("/admin") && pathname !== "/admin/login",
  });

  useEffect(() => {
    const expireSession = () => {
      clearCsrfToken();
      queryClient.clear();
      if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
        router.replace("/admin/login?motivo=sessao-expirada");
      }
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, expireSession);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expireSession);
  }, [pathname, queryClient, router]);

  const clearLocalSession = () => {
    clearCsrfToken();
    queryClient.clear();
  };

  const value: AuthContextValue = {
    user: session.data || null,
    loading: session.isLoading,
    refetch: session.refetch,
    login: async (email, senha) => {
      const result = await apiRequest<{ usuario: SessionUser }>("/auth/login", {
        method: "POST",
        body: { email, senha },
        retryAuth: false,
      });
      queryClient.setQueryData(queryKeys.session, result.usuario);
      return result.usuario;
    },
    logout: async (all = false) => {
      await apiRequest(all ? "/auth/logout-all" : "/auth/logout", { method: "POST", csrf: true, retryAuth: false });
      clearLocalSession();
    },
    clearLocalSession,
    hasPermission: (permission) => {
      const user = session.data;
      if (!user) return false;
      const level = String(user.nivel || user.nivel_acesso || "").toLowerCase();
      return level === "admin" || user.permissoes?.includes(permission);
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth precisa estar dentro de AuthProvider.");
  return value;
}

