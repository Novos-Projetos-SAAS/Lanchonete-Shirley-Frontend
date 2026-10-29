import { NotificationsPage } from "@/features/notifications/notifications-page";
import { PermissionBoundary } from "@/components/shared/permission-boundary";
export default function Page() { return <PermissionBoundary permission="notificacoes.receber"><NotificationsPage /></PermissionBoundary>; }

