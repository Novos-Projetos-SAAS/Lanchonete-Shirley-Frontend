import { LogsPage } from "@/features/admin/logs-page";
import { PermissionBoundary } from "@/components/shared/permission-boundary";
export default function Page() { return <PermissionBoundary permission="logs.listar"><LogsPage /></PermissionBoundary>; }

