import { ManualOrderPage } from "@/features/orders/manual-order-page";
import { PermissionBoundary } from "@/components/shared/permission-boundary";
export default function Page() { return <PermissionBoundary permission="pedidos.criar"><ManualOrderPage /></PermissionBoundary>; }

