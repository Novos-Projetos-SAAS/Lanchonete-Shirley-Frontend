"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button, ErrorState } from "@/components/ui";
import { useAuth } from "@/features/auth/auth-provider";

export function PermissionBoundary({ permission, children }: { permission: string; children: ReactNode }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) return <ErrorState title="Acesso não permitido" description="Seu perfil não possui a permissão necessária para esta área. Nenhuma consulta protegida foi enviada." action={<Button asChild variant="secondary"><Link href="/admin/perfil">Voltar ao meu perfil</Link></Button>} />;
  return <>{children}</>;
}
