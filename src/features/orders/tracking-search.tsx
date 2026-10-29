"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button, Card, Field, Input, PageHeader } from "@/components/ui";

export function TrackingSearch() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  function submit(event: React.FormEvent) { event.preventDefault(); const value = code.trim().toLowerCase(); if (!/^[a-f0-9]{32}$/.test(value)) { setError("O código deve ter 32 letras e números."); return; } router.push(`/acompanhar/${value}`); }
  return <main className="container centered-page" id="conteudo-principal"><div className="tracking-search"><PageHeader eyebrow="Cadê meu lanche?" title="Acompanhar pedido" description="Digite o código mostrado depois da confirmação. Nenhum dado pessoal vai para a URL." /><Card><form className="stack" onSubmit={submit} noValidate><Field label="Código de acompanhamento" htmlFor="tracking-code" required error={error}><Input id="tracking-code" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={32} value={code} onChange={(event) => { setCode(event.target.value); setError(""); }} placeholder="32 caracteres" /></Field><Button type="submit" size="lg"><Search aria-hidden /> Ver andamento</Button></form></Card></div></main>;
}

