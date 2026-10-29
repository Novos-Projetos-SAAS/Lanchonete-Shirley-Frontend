import type { Metadata } from "next";
import { PermissionBoundary } from "@/components/shared/permission-boundary";
import { InvitationsPage } from "@/features/admin/invitations-page";

export const metadata: Metadata = { title: "Convites", robots: { index: false, follow: false } };

export default function Page() {
  return <PermissionBoundary permission="convites.listar"><InvitationsPage /></PermissionBoundary>;
}
