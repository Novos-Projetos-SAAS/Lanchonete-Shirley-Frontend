"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, CheckCircle2, MapPin, RefreshCw, Store, Truck } from "lucide-react";
import { Button, Card, Checkbox, EmptyState, ErrorState, Field, FieldGroup, Input, PageHeader, PriceBreakdown, Radio, Select, Textarea } from "@/components/ui";
import { ApiError } from "@/lib/api-client";
import { clearAttempt, getOrCreateAttempt } from "@/lib/idempotency";
import { centsToMoney } from "@/lib/money";
import { queryKeys } from "@/lib/query-keys";
import { publicService } from "@/services/public-service";
import { cartTotalCents, useCartStore } from "@/store/cart-store";
import type { CreateOrderInput, OrderSummary } from "@/types/domain";

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome.").max(120),
  telefone: z.string().trim().regex(/^\+?[0-9 ()-]{10,20}$/, "Informe um telefone com DDD."),
  tipo_entrega: z.enum(["ENTREGA", "RETIRADA"]),
  logradouro: z.string().trim().max(160),
  numero: z.string().trim().max(30),
  sem_numero: z.boolean(),
  bairro: z.string().trim().max(100),
  cidade: z.string().trim().max(100),
  uf: z.string().trim().length(2, "Use 2 letras."),
  complemento: z.string().trim().max(160),
  referencia: z.string().trim().max(200),
  metodo_pagamento_id: z.string().min(1, "Escolha a forma de pagamento."),
  precisa_troco: z.boolean(),
  troco_para: z.string().trim(),
  observacoes: z.string().trim().max(500),
}).superRefine((value, ctx) => {
  if (value.tipo_entrega === "ENTREGA") {
    if (!value.logradouro) ctx.addIssue({ code: "custom", path: ["logradouro"], message: "Informe a rua." });
    if (!value.bairro) ctx.addIssue({ code: "custom", path: ["bairro"], message: "Informe o bairro." });
    if (!value.cidade) ctx.addIssue({ code: "custom", path: ["cidade"], message: "Informe a cidade." });
    if (!value.numero && !value.sem_numero) ctx.addIssue({ code: "custom", path: ["numero"], message: "Informe o número ou marque sem número." });
  }
  if (value.precisa_troco && !/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/.test(value.troco_para)) {
    ctx.addIssue({ code: "custom", path: ["troco_para"], message: "Informe o valor para troco, usando ponto. Ex.: 50.00" });
  }
});

type FormValues = z.infer<typeof schema>;
const CONFIRMATION_KEY = "shirley.order.confirmation";

export function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const hydrated = useCartStore((state) => state.hydrated);
  const clearCart = useCartStore((state) => state.clear);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const status = useQuery({ queryKey: queryKeys.storeStatus, queryFn: publicService.status });
  const payments = useQuery({ queryKey: queryKeys.payments, queryFn: publicService.paymentMethods });
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      nome: "", telefone: "", tipo_entrega: "RETIRADA", logradouro: "", numero: "", sem_numero: false,
      bairro: "", cidade: "", uf: "SP", complemento: "", referencia: "", metodo_pagamento_id: "",
      precisa_troco: false, troco_para: "", observacoes: "",
    },
  });
  const deliveryType = useWatch({ control: form.control, name: "tipo_entrega" });
  const paymentMethodId = useWatch({ control: form.control, name: "metodo_pagamento_id" });
  const changeNeeded = useWatch({ control: form.control, name: "precisa_troco" });
  const isCashPayment = payments.data?.some((method) => method.id === paymentMethodId && method.codigo === "DINHEIRO") ?? false;
  const total = useMemo(() => cartTotalCents(items), [items]);

  useEffect(() => {
    if (payments.data?.length === 1) form.setValue("metodo_pagamento_id", payments.data[0].id);
  }, [form, payments.data]);

  useEffect(() => {
    if (!isCashPayment && changeNeeded) {
      form.setValue("precisa_troco", false);
      form.setValue("troco_para", "");
    }
  }, [changeNeeded, form, isCashPayment]);

  if (!hydrated) return <main className="container centered-page" id="conteudo-principal">Carregando…</main>;
  if (!items.length) return <main className="container centered-page" id="conteudo-principal"><EmptyState title="Seu carrinho está vazio" description="Adicione pelo menos um item antes de finalizar." action={<Button asChild><Link href="/">Ver cardápio</Link></Button>} /></main>;
  if (status.data && !status.data.aberta) return <main className="container centered-page" id="conteudo-principal"><ErrorState title="A loja não está aceitando pedidos" description={status.data.mensagem || "Você pode consultar o cardápio e voltar quando a loja abrir."} action={<Button asChild><Link href="/"><ArrowLeft aria-hidden /> Voltar ao cardápio</Link></Button>} /></main>;

  async function submit(values: FormValues) {
    setSubmitError(null);
    const body: CreateOrderInput = {
      cliente: { nome: values.nome, telefone: values.telefone },
      tipo_entrega: values.tipo_entrega,
      endereco: values.tipo_entrega === "ENTREGA" ? {
        logradouro: values.logradouro, numero: values.numero || null, sem_numero: values.sem_numero,
        bairro: values.bairro, cidade: values.cidade, uf: values.uf.toUpperCase(), complemento: values.complemento || null,
        referencia: values.referencia || null,
      } : null,
      metodo_pagamento_id: values.metodo_pagamento_id,
      precisa_troco: isCashPayment && values.precisa_troco,
      troco_para: isCashPayment && values.precisa_troco ? values.troco_para : null,
      observacoes: values.observacoes || null,
      itens: items.map((item) => ({
        produto_id: item.produtoId, quantidade: item.quantidade, tipo_pao_id: item.pao?.id || null,
        adicionais: item.adicionais.map((extra) => ({ adicional_id: extra.id, quantidade: extra.quantidade })),
        observacoes: item.observacoes || null,
      })),
    };
    const attempt = getOrCreateAttempt(body);
    try {
      const result = await publicService.createOrder(body, attempt.key);
      const safeConfirmation: Partial<OrderSummary> = {
        pedido_id: result.pedido_id, codigo_acompanhamento: result.codigo_acompanhamento, status: result.status,
        subtotal: result.subtotal, taxa_entrega: result.taxa_entrega, total: result.total, criado_em: result.criado_em,
      };
      sessionStorage.setItem(CONFIRMATION_KEY, JSON.stringify(safeConfirmation));
      clearAttempt();
      clearCart();
      router.replace("/pedido/confirmado");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Não foi possível enviar o pedido.";
      setSubmitError(`${message} Se tentar de novo sem alterar os dados, a mesma tentativa segura será reutilizada.`);
    }
  }

  return (
    <main className="container section checkout-page" id="conteudo-principal">
      <PageHeader eyebrow="Última conferência" title="Finalizar pedido" description="Seus dados são enviados somente à loja e não ficam guardados no carrinho." />
      <form className="split-layout" onSubmit={form.handleSubmit(submit)} noValidate>
        <div className="stack-lg">
          <FieldGroup className="checkout-card" title="Como você quer receber?">
            <Controller control={form.control} name="tipo_entrega" render={({ field }) => <div className="delivery-options">
              <Radio name={field.name} checked={field.value === "RETIRADA"} onChange={() => field.onChange("RETIRADA")}><Store aria-hidden /><span><strong>Retirar no local</strong><small>Sem taxa de entrega</small></span></Radio>
              <Radio name={field.name} checked={field.value === "ENTREGA"} onChange={() => field.onChange("ENTREGA")}><Truck aria-hidden /><span><strong>Receber em casa</strong><small>Taxa calculada pela loja</small></span></Radio>
            </div>} />
          </FieldGroup>

          <FieldGroup className="checkout-card" title="Seus dados" description="Usados somente para identificar e atualizar este pedido.">
            <div className="form-grid form-grid--2">
              <Field label="Nome" htmlFor="nome" required error={form.formState.errors.nome?.message}><Input id="nome" autoComplete="name" {...form.register("nome")} /></Field>
              <Field label="Telefone com DDD" htmlFor="telefone" required error={form.formState.errors.telefone?.message}><Input id="telefone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(18) 99999-9999" {...form.register("telefone")} /></Field>
            </div>
          </FieldGroup>

          {deliveryType === "ENTREGA" && <FieldGroup className="checkout-card" title={<><MapPin aria-hidden /> Endereço de entrega</>}>
            <div className="form-grid form-grid--2">
              <Field label="Rua / avenida" htmlFor="logradouro" required error={form.formState.errors.logradouro?.message}><Input id="logradouro" autoComplete="address-line1" {...form.register("logradouro")} /></Field>
              <Field label="Número" htmlFor="numero" error={form.formState.errors.numero?.message}><Input id="numero" inputMode="numeric" {...form.register("numero")} /></Field>
              <Controller control={form.control} name="sem_numero" render={({ field }) => <Checkbox checked={field.value} onChange={field.onChange}>Endereço sem número</Checkbox>} />
              <Field label="Bairro" htmlFor="bairro" required error={form.formState.errors.bairro?.message}><Input id="bairro" autoComplete="address-level3" {...form.register("bairro")} /></Field>
              <Field label="Cidade" htmlFor="cidade" required error={form.formState.errors.cidade?.message}><Input id="cidade" autoComplete="address-level2" {...form.register("cidade")} /></Field>
              <Field label="UF" htmlFor="uf" required error={form.formState.errors.uf?.message}><Input id="uf" maxLength={2} autoCapitalize="characters" autoComplete="address-level1" {...form.register("uf")} /></Field>
              <Field label="Complemento" htmlFor="complemento"><Input id="complemento" autoComplete="address-line2" {...form.register("complemento")} /></Field>
              <Field label="Ponto de referência" htmlFor="referencia"><Input id="referencia" {...form.register("referencia")} /></Field>
            </div>
          </FieldGroup>}

          <FieldGroup className="checkout-card" title="Pagamento">
            {payments.isError ? <ErrorState compact title="Formas de pagamento indisponíveis" description="Tente carregar novamente antes de enviar." action={<Button type="button" variant="ghost" onClick={() => void payments.refetch()}><RefreshCw aria-hidden /> Tentar novamente</Button>} /> : <div className="form-grid">
              <Field label="Forma de pagamento" htmlFor="metodo" required error={form.formState.errors.metodo_pagamento_id?.message}><Select id="metodo" {...form.register("metodo_pagamento_id")}><option value="">Selecione</option>{payments.data?.map((method) => <option value={method.id} key={method.id}>{method.nome}</option>)}</Select></Field>
              {isCashPayment && <Controller control={form.control} name="precisa_troco" render={({ field }) => <Checkbox checked={field.value} onChange={field.onChange}>Preciso de troco</Checkbox>} />}
              {isCashPayment && changeNeeded && <Field label="Troco para" htmlFor="troco" required hint="Use ponto nos centavos. Ex.: 50.00" error={form.formState.errors.troco_para?.message}><Input id="troco" inputMode="decimal" placeholder="50.00" {...form.register("troco_para")} /></Field>}
            </div>}
            <Field label="Observações gerais" htmlFor="observacoes"><Textarea id="observacoes" maxLength={500} placeholder="Informações importantes para a entrega ou retirada" {...form.register("observacoes")} /></Field>
          </FieldGroup>
        </div>

        <Card className="sticky-summary checkout-summary">
          <h2>Resumo</h2>
          <PriceBreakdown lines={[{ label: "Itens", value: centsToMoney(total) }, { label: deliveryType === "ENTREGA" ? "Entrega (a confirmar)" : "Retirada", value: "0.00" }, { label: "Estimativa", value: centsToMoney(total), emphasis: true }]} note="O servidor recalcula tudo com o cardápio atual." />
          {submitError && <div className="form-error-summary" role="alert"><strong>Pedido não enviado</strong><p>{submitError}</p></div>}
          <Button full size="lg" type="submit" loading={form.formState.isSubmitting} disabled={payments.isError || status.isLoading}><CheckCircle2 aria-hidden /> Confirmar pedido</Button>
          <Button full variant="ghost" asChild><Link href="/carrinho"><ArrowLeft aria-hidden /> Voltar ao carrinho</Link></Button>
          <p className="privacy-note">Ao confirmar, você envia apenas os dados necessários para este pedido.</p>
        </Card>
      </form>
    </main>
  );
}
