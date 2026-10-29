"use client";

import { ResourcePage, resourceConfigs } from "@/features/admin/resource-page";
import { PermissionBoundary } from "@/components/shared/permission-boundary";
export default function Page() { return <PermissionBoundary permission="produtos.listar"><ResourcePage config={resourceConfigs.produtos} /></PermissionBoundary>; }

