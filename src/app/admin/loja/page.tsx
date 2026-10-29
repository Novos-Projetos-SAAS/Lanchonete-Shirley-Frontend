import { StorePage } from "@/features/admin/store-page";
import { PermissionBoundary } from "@/components/shared/permission-boundary";
export default function Page() { return <PermissionBoundary permission="loja.visualizar"><StorePage /></PermissionBoundary>; }

