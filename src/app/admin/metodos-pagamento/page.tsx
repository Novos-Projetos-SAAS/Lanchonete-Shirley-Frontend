"use client";

import { ResourcePage, resourceConfigs } from "@/features/admin/resource-page";
import { PermissionBoundary } from "@/components/shared/permission-boundary";
export default function Page() { return <PermissionBoundary permission="metodos_pagamento.listar"><ResourcePage config={resourceConfigs["metodos-pagamento"]} /></PermissionBoundary>; }

