"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { clearFormFieldError, toFormError, type FormErrorFeedback } from "@/lib/api-errors";
import { BrandMark } from "@/components/shared/brand-mark";
import { Button, Field, FormErrorSummary, IconButton, Input } from "@/components/ui";
import { useAuth } from "./auth-provider";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState<FormErrorFeedback | null>(null);
  async function submit(event: React.FormEvent) { event.preventDefault(); setError(null); setLoading(true); try { await login(email, password); const target = params.get("retorno"); router.replace(target?.startsWith("/admin") && !target.startsWith("//") ? target : "/admin"); } catch (cause) { setError(toFormError(cause, { fallback: "Não foi possível entrar." })); } finally { setLoading(false); } }
  return <main className="login-shell" id="conteudo-principal"><div className="login-card"><BrandMark href="/" /><p className="eyebrow">Acesso da equipe</p><h1>Bom turno.</h1><p>Entre para acompanhar pedidos e cuidar da operação.</p><form className="stack" onSubmit={submit} noValidate><FormErrorSummary error={error} fieldIds={{ email: "login-email", senha: "login-password" }} /><Field label="E-mail" htmlFor="login-email" required error={error?.fields.email}><Input id="login-email" type="email" inputMode="email" autoComplete="username" value={email} onChange={(event) => { setEmail(event.target.value); setError((current) => clearFormFieldError(current, "email")); }} required /></Field><Field label="Senha" htmlFor="login-password" required error={error?.fields.senha}><div className="password-field"><Input id="login-password" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setError((current) => clearFormFieldError(current, "senha")); }} required /><IconButton type="button" label={show ? "Ocultar senha" : "Mostrar senha"} aria-pressed={show} onClick={() => setShow((value) => !value)}>{show ? <EyeOff aria-hidden /> : <Eye aria-hidden />}</IconButton></div></Field><Button full size="lg" type="submit" loading={loading}><LogIn aria-hidden /> Entrar no painel</Button></form><p className="login-help">Use as credenciais administrativas configuradas no backend. Senhas nunca são salvas no navegador.</p></div></main>;
}

