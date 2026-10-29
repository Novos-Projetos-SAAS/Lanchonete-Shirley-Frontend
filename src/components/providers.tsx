"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { AuthProvider } from "@/features/auth/auth-provider";
import { ToastProvider } from "@/components/ui/toast";
import { ServiceWorkerRegistration } from "@/features/pwa/service-worker-registration";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
      mutations: { retry: false },
    },
  }));
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          {children}
          <ServiceWorkerRegistration />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

