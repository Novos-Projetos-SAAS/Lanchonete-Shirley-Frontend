"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, KeyRound, UserRoundPlus } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { clearFormFieldError, toFormError, type FormErrorFeedback } from "@/lib/api-errors";
import { publicService } from "@/services/public-service";
import type { InvitationValidation } from "@/types/domain";
import { Button, Card, ErrorState, Field, FormErrorSummary, IconButton, Input } from "@/components/ui";

type Phase = "loading" | "invalid" | "form" | "success";

function fragmentToken() {
  const raw = window.location.hash.slice(1);
  const params = new URLSearchParams(raw);
  const candidate = params.get("token") || (raw.includes("=") ? "" : raw);
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  return candidate && /^[A-Za-z0-9_-]{40,128}$/.test(candidate) ? candidate : null;
}

export function InvitationPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [details, setDetails] = useState<InvitationValidation | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<FormErrorFeedback | null>(null);

  useEffect(() => {
    const candidate = fragmentToken();
    if (!candidate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("invalid");
      return;
    }
    setToken(candidate);
    void publicService.validateInvitation(candidate)
      .then((result) => {
        if (!result.valido) { setToken(null); setPhase("invalid"); return; }
        setDetails(result);
        setPhase("form");
      })
      .catch(() => { setToken(null); setPhase("invalid"); });
  }, []);

  async function accept(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!token) { setPhase("invalid"); return; }
    if (name.trim().length < 1) { setError({ message: "Revise os campos destacados.", fields: { nome: "Informe seu nome." } }); return; }
    if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      setError({ message: "Revise os campos destacados.", fields: { senha: "Use ao menos 12 caracteres, com letra maiúscula, minúscula e número." } });
      return;
    }
    if (password !== confirm) { setError({ message: "Revise os campos destacados.", fields: { confirmar_senha: "A confirmação deve ser igual à senha." } }); return; }
    setBusy(true);
    try {
      await publicService.acceptInvitation({ token, nome: name.trim(), senha: password, confirmar_senha: confirm });
      setToken(null);
      setPassword("");
      setConfirm("");
      setPhase("success");
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "INVITATION_UNAVAILABLE") { setToken(null); setPhase("invalid"); }
      else setError(toFormError(cause, { fallback: "Não foi possível aceitar o convite." }));
    } finally {
      setBusy(false);
    }
  }

  if (phase === "loading") return <main className="container invitation-shell" id="conteudo-principal" aria-busy="true"><Card className="invitation-card"><p className="eyebrow">Acesso à equipe</p><h1>Validando convite…</h1><p className="muted">Isso leva só um instante.</p></Card></main>;
  if (phase === "invalid") return <main className="container invitation-shell" id="conteudo-principal"><ErrorState title="Este convite não está disponível" description="O link pode ter expirado, sido revogado ou já ter sido usado. Peça um novo convite ao administrador." action={<Button asChild variant="secondary"><Link href="/admin/login">Ir para o login</Link></Button>} /></main>;
  if (phase === "success") return <main className="container invitation-shell" id="conteudo-principal"><Card className="invitation-card invitation-success"><CheckCircle2 aria-hidden /><p className="eyebrow">Conta criada</p><h1>Convite aceito</h1><p>Sua senha foi cadastrada. Agora entre no painel com o e-mail do convite.</p><Button asChild><Link href="/admin/login">Entrar no painel</Link></Button></Card></main>;

  return <main className="container invitation-shell" id="conteudo-principal"><Card className="invitation-card"><div className="invitation-card__icon"><UserRoundPlus aria-hidden /></div><p className="eyebrow">Acesso à equipe</p><h1>Crie sua conta</h1><p className="muted">Convite para <strong>{details?.email_mascarado}</strong>{details?.nivel ? ` · nível ${details.nivel}` : ""}.</p><form className="stack" onSubmit={accept} noValidate><FormErrorSummary error={error} fieldIds={{ nome: "invite-name", senha: "invite-password", confirmar_senha: "invite-confirm" }} /><Field label="Seu nome" htmlFor="invite-name" required error={error?.fields.nome}><Input id="invite-name" autoComplete="name" value={name} onChange={(event) => { setName(event.target.value); setError((current) => clearFormFieldError(current, "nome")); }} /></Field><Field label="Senha" htmlFor="invite-password" required hint="Mínimo de 12 caracteres, com maiúscula, minúscula e número." error={error?.fields.senha}><div className="password-field"><Input id="invite-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => { setPassword(event.target.value); setError((current) => clearFormFieldError(current, "senha")); }} /><IconButton type="button" label={showPassword ? "Ocultar senha" : "Mostrar senha"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff aria-hidden /> : <Eye aria-hidden />}</IconButton></div></Field><Field label="Confirmar senha" htmlFor="invite-confirm" required error={error?.fields.confirmar_senha}><div className="password-field"><Input id="invite-confirm" type={showConfirm ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(event) => { setConfirm(event.target.value); setError((current) => clearFormFieldError(current, "confirmar_senha")); }} /><IconButton type="button" label={showConfirm ? "Ocultar confirmação" : "Mostrar confirmação"} aria-pressed={showConfirm} onClick={() => setShowConfirm((value) => !value)}>{showConfirm ? <EyeOff aria-hidden /> : <Eye aria-hidden />}</IconButton></div></Field><Button type="submit" size="lg" full loading={busy}><KeyRound aria-hidden /> Criar conta</Button></form></Card></main>;
}
