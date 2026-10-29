import { UsersPage } from "@/features/admin/users-page";
import { PermissionBoundary } from "@/components/shared/permission-boundary";
export default function Page() { return <PermissionBoundary permission="usuarios.listar"><UsersPage /></PermissionBoundary>; }

