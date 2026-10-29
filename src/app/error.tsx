"use client";
import { Button, ErrorState } from "@/components/ui";
import { RefreshCw } from "lucide-react";
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="container centered-page" id="conteudo-principal"><ErrorState title="Esta tela não carregou" description="Tente novamente. Se o problema continuar, confira se o serviço da lanchonete está disponível." action={<Button onClick={reset}><RefreshCw aria-hidden /> Tentar novamente</Button>} /></main>; }

