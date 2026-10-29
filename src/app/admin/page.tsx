import { DashboardPage } from "@/features/admin/dashboard-page";
import { PermissionBoundary } from "@/components/shared/permission-boundary";
export default function Page() { return <PermissionBoundary permission="dashboard.visualizar"><DashboardPage /></PermissionBoundary>; }

