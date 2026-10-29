import { AdminOrdersPage } from "@/features/orders/admin-orders-page";
import { PermissionBoundary } from "@/components/shared/permission-boundary";
export default function Page() { return <PermissionBoundary permission="pedidos.listar"><AdminOrdersPage /></PermissionBoundary>; }

