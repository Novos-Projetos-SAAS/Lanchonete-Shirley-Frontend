import type { Metadata } from "next";
import { InvitationPage } from "@/features/auth/invitation-page";

export const metadata: Metadata = {
  title: "Aceitar convite",
  referrer: "no-referrer",
  robots: { index: false, follow: false, noarchive: true },
};

export default function Page() { return <InvitationPage />; }
