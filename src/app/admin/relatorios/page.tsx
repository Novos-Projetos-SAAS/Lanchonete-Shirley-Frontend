import { ReportsPage } from "@/features/admin/reports-page";
import { PermissionBoundary } from "@/components/shared/permission-boundary";
export default function Page() { return <PermissionBoundary permission="relatorios.visualizar"><ReportsPage /></PermissionBoundary>; }

