import { OrderDetailPage } from "@/features/orders/order-detail-page";
import { PermissionBoundary } from "@/components/shared/permission-boundary";
export default function Page() { return <PermissionBoundary permission="pedidos.listar"><OrderDetailPage /></PermissionBoundary>; }

