import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button, EmptyState } from "@/components/ui";
export default function NotFound() { return <main className="container centered-page" id="conteudo-principal"><EmptyState title="Essa página não está no balcão" description="O endereço pode ter mudado ou não existe." action={<Button asChild><Link href="/"><ArrowLeft aria-hidden /> Voltar ao cardápio</Link></Button>} /></main>; }

