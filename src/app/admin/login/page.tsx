import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/login-form";
export const metadata: Metadata = { title: "Entrar no painel", robots: { index: false, follow: false } };
export default function Page() { return <Suspense><LoginForm /></Suspense>; }

