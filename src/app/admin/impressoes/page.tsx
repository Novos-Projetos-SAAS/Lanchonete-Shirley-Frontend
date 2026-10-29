import { PrintingPage } from "@/features/printing/printing-page";
import { PermissionBoundary } from "@/components/shared/permission-boundary";
export default function Page() { return <PermissionBoundary permission="impressoes.listar"><PrintingPage /></PermissionBoundary>; }

