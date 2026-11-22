"use client";

import { ResourcePage, resourceConfigs } from "@/features/admin/resource-page";
import { PermissionBoundary } from "@/components/shared/permission-boundary";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function Products() {
  const params = useSearchParams();
  const category = params.get("categoria_id") || "";
  const search = params.get("busca") || "";
  return <ResourcePage key={`${category}:${search}`} config={resourceConfigs.produtos} initialCategory={category} initialSearch={search} />;
}

export default function Page() {
  return <PermissionBoundary permission="produtos.listar"><Suspense fallback={<p role="status">Carregando catálogo…</p>}><Products /></Suspense></PermissionBoundary>;
}

