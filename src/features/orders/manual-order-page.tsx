"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Save, Trash2 } from "lucide-react";
import { clearFormFieldError, toFormError, type FormErrorFeedback } from "@/lib/api-errors";
import { queryKeys } from "@/lib/query-keys";
import { adminService } from "@/services/admin-service";
import { publicService } from "@/services/public-service";
import type { CreateOrderInput, OrderItemInput, Product } from "@/types/domain";
import { Button, Card, Checkbox, EmptyState, Field, FormErrorSummary, IconButton, Input, PageHeader, Radio, Select, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/toast";

interface DraftItem extends OrderItemInput { key: string; nome: string; detalhe: string }
export function ManualOrderPage() {
  const router = useRouter(); const { toast } = useToast();
  const menu = useQuery({ queryKey: queryKeys.menu, queryFn: publicService.menu }); const payments = useQuery({ queryKey: queryKeys.payments, queryFn: publicService.paymentMethods });
  const products = useMemo(() => (menu.data || []).flatMap((category) => category.produtos || []), [menu.data]);
  const [productId, setProductId] = useState(""); const [breadId, setBreadId] = useState(""); const [additionals, setAdditionals] = useState<Record<string, boolean>>({}); const [itemQty, setItemQty] = useState(1); const [itemNotes, setItemNotes] = useState(""); const [items, setItems] = useState<DraftItem[]>([]);
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [delivery, setDelivery] = useState<"ENTREGA" | "RETIRADA">("RETIRADA"); const [street, setStreet] = useState(""); const [number, setNumber] = useState(""); const [noNumber, setNoNumber] = useState(false); const [district, setDistrict] = useState(""); const [city, setCity] = useState(""); const [uf, setUf] = useState("SP"); const [paymentId, setPaymentId] = useState(""); const [notes, setNotes] = useState(""); const [saving, setSaving] = useState(false); const [error, setError] = useState<FormErrorFeedback | null>(null);
  const selected = products.find((product) => product.id === productId);
  function reportError(message: string, fields: Record<string, string> = {}) { setError({ message, fields }); }
  function clearError(field: string) { setError((current) => clearFormFieldError(current, field)); }
  function selectProduct(id: string) { setProductId(id); setBreadId(""); setAdditionals({}); setItemQty(1); setItemNotes(""); }
  function addItem() {
    if (!selected) return; if (selected.tipo === "LANCHE" && !breadId) { reportError("Revise o item antes de adicionar.", { tipo_pao_id: "Escolha o pão do lanche." }); return; }
    const bread = selected.tipos_pao?.find((option) => option.id === breadId); const extras = (selected.adicionais || []).filter((item) => additionals[item.id]);
    setItems((current) => [...current, { key: crypto.randomUUID(), produto_id: selected.id, quantidade: itemQty, tipo_pao_id: breadId || null, adicionais: extras.map((item) => ({ adicional_id: item.id, quantidade: 1 })), observacoes: itemNotes || null, nome: selected.nome, detalhe: [bread?.nome, ...extras.map((item) => item.nome)].filter(Boolean).join(" · ") || "Configuração padrão" }]);
    selectProduct(""); setError(null);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(null);
    const requiredFields = { ...(!name.trim() ? { nome: "Informe o nome do cliente." } : {}), ...(!/^\+?[0-9 ()-]{10,20}$/.test(phone) ? { telefone: "Informe um telefone com DDD." } : {}), ...(!paymentId ? { metodo_pagamento_id: "Escolha a forma de pagamento." } : {}), ...(!items.length ? { itens: "Adicione pelo menos um item." } : {}) };
    if (Object.keys(requiredFields).length) { reportError("Preencha os dados necessários para criar o pedido.", requiredFields); return; }
    if (delivery === "ENTREGA" && (!street || !district || !city || (!number && !noNumber))) { reportError("Complete o endereço de entrega.", { ...(!street ? { logradouro: "Informe a rua." } : {}), ...(!district ? { bairro: "Informe o bairro." } : {}), ...(!city ? { cidade: "Informe a cidade." } : {}), ...(!number && !noNumber ? { numero: "Informe o número ou marque sem número." } : {}) }); return; }
    const body: CreateOrderInput = { cliente: { nome: name, telefone: phone }, tipo_entrega: delivery, endereco: delivery === "ENTREGA" ? { logradouro: street, numero: number || null, sem_numero: noNumber, bairro: district, cidade: city, uf: uf.toUpperCase() } : null, metodo_pagamento_id: paymentId, precisa_troco: false, troco_para: null, observacoes: notes || null, itens: items.map((item) => ({ produto_id: item.produto_id, quantidade: item.quantidade, tipo_pao_id: item.tipo_pao_id, adicionais: item.adicionais, observacoes: item.observacoes })) };
    setSaving(true); try { const result = await adminService.createOrder(body); toast({ tone: "success", title: "Pedido manual criado" }); router.push(`/admin/pedidos/${result.pedido_id}`); } catch (cause) { setError(toFormError(cause, { fallback: "Não foi possível criar o pedido.", aliases: { "cliente.nome": "nome", "cliente.telefone": "telefone", "endereco.logradouro": "logradouro", "endereco.numero": "numero", "endereco.bairro": "bairro", "endereco.cidade": "cidade", "endereco.uf": "uf" } })); } finally { setSaving(false); }
  }
  return <div>
    <PageHeader eyebrow="Balcão e telefone" title="Novo pedido manual" description="Pedidos do painel podem ser criados mesmo quando o canal web está fechado. A API recalcula todos os valores." />
    <form className="split-layout" onSubmit={submit} noValidate>
      <div className="stack">
        <Card className="admin-card">
          <h2>1. Cliente e recebimento</h2>
          <div className="manual-section-stack">
            <fieldset className="manual-fieldset">
              <legend>Dados do cliente</legend>
              <p>Identificação usada pela equipe durante o atendimento.</p>
              <div className="form-grid form-grid--2">
                <Field label="Nome" htmlFor="manual-name" required error={error?.fields.nome}><Input id="manual-name" autoComplete="name" value={name} onChange={(event) => { setName(event.target.value); clearError("nome"); }} /></Field>
                <Field label="Telefone" htmlFor="manual-phone" required hint="Informe DDD e número." error={error?.fields.telefone}><Input id="manual-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => { setPhone(event.target.value); clearError("telefone"); }} /></Field>
              </div>
            </fieldset>
            <fieldset className="manual-fieldset">
              <legend>Recebimento</legend>
              <p>Escolha como o cliente receberá este pedido.</p>
              <div className="delivery-options">
                <Radio name="manual-delivery" value="RETIRADA" checked={delivery === "RETIRADA"} onChange={() => setDelivery("RETIRADA")}>Retirada</Radio>
                <Radio name="manual-delivery" value="ENTREGA" checked={delivery === "ENTREGA"} onChange={() => setDelivery("ENTREGA")}>Entrega</Radio>
              </div>
              {delivery === "ENTREGA" && <div className="form-grid form-grid--2 manual-address">
                <Field label="Rua" htmlFor="manual-street" required error={error?.fields.logradouro}><Input id="manual-street" autoComplete="street-address" value={street} onChange={(event) => { setStreet(event.target.value); clearError("logradouro"); }} /></Field>
                <Field label="Número" htmlFor="manual-number" error={error?.fields.numero}><Input id="manual-number" inputMode="numeric" value={number} onChange={(event) => { setNumber(event.target.value); clearError("numero"); }} /></Field>
                <Checkbox checked={noNumber} onChange={(event) => setNoNumber(event.target.checked)}>Sem número</Checkbox>
                <Field label="Bairro" htmlFor="manual-district" required error={error?.fields.bairro}><Input id="manual-district" value={district} onChange={(event) => { setDistrict(event.target.value); clearError("bairro"); }} /></Field>
                <Field label="Cidade" htmlFor="manual-city" required error={error?.fields.cidade}><Input id="manual-city" autoComplete="address-level2" value={city} onChange={(event) => { setCity(event.target.value); clearError("cidade"); }} /></Field>
                <Field label="UF" htmlFor="manual-uf" required error={error?.fields.uf}><Input id="manual-uf" autoComplete="address-level1" maxLength={2} value={uf} onChange={(event) => { setUf(event.target.value); clearError("uf"); }} /></Field>
              </div>}
            </fieldset>
          </div>
        </Card>
        <Card className="admin-card"><h2>2. Montar itens</h2>{menu.isError ? <EmptyState compact title="Cardápio indisponível" description="Tente novamente para selecionar produtos." /> : <div className="stack"><Field label="Produto" htmlFor="manual-product" error={error?.fields.itens}><Select id="manual-product" value={productId} onChange={(event) => { selectProduct(event.target.value); clearError("itens"); }}><option value="">Selecione</option>{products.map((product) => <option key={product.id} value={product.id}>{product.nome}</option>)}</Select></Field>{selected && <ProductOptions product={selected} breadId={breadId} setBreadId={(id) => { setBreadId(id); clearError("tipo_pao_id"); }} breadError={error?.fields.tipo_pao_id} additionals={additionals} setAdditionals={setAdditionals} quantity={itemQty} setQuantity={setItemQty} notes={itemNotes} setNotes={setItemNotes} />}<Button type="button" variant="secondary" disabled={!selected} onClick={addItem}><Plus aria-hidden /> Adicionar item</Button></div>}</Card>
        <Card className="admin-card"><h2>3. Pagamento e observações</h2><Field label="Forma de pagamento" htmlFor="manual-payment" required error={error?.fields.metodo_pagamento_id}><Select id="manual-payment" value={paymentId} onChange={(event) => { setPaymentId(event.target.value); clearError("metodo_pagamento_id"); }}><option value="">Selecione</option>{payments.data?.map((method) => <option value={method.id} key={method.id}>{method.nome}</option>)}</Select></Field><Field label="Observações" htmlFor="manual-notes"><Textarea id="manual-notes" value={notes} onChange={(event) => setNotes(event.target.value)} /></Field></Card>
      </div>
      <Card className="sticky-summary"><h2>Itens do pedido</h2>{items.length ? <div className="manual-items">{items.map((item) => <div key={item.key}><div><strong>{item.quantidade}× {item.nome}</strong><small>{item.detalhe}</small></div><IconButton type="button" label={`Remover ${item.nome}`} onClick={() => setItems((current) => current.filter((row) => row.key !== item.key))}><Trash2 aria-hidden /></IconButton></div>)}</div> : <p className="muted">Nenhum item adicionado.</p>}<FormErrorSummary error={error} fieldIds={{ nome: "manual-name", telefone: "manual-phone", logradouro: "manual-street", numero: "manual-number", bairro: "manual-district", cidade: "manual-city", uf: "manual-uf", itens: "manual-product", tipo_pao_id: "manual-bread", metodo_pagamento_id: "manual-payment" }} /><Button type="submit" full size="lg" loading={saving}><Save aria-hidden /> Criar pedido</Button></Card>
    </form>
  </div>;
}

function ProductOptions({ product, breadId, setBreadId, breadError, additionals, setAdditionals, quantity, setQuantity, notes, setNotes }: { product: Product; breadId: string; setBreadId: (id: string) => void; breadError?: string; additionals: Record<string, boolean>; setAdditionals: React.Dispatch<React.SetStateAction<Record<string, boolean>>>; quantity: number; setQuantity: (value: number) => void; notes: string; setNotes: (value: string) => void }) {
  return <div className="manual-product-options">{product.tipo === "LANCHE" && <Field label="Pão obrigatório" htmlFor="manual-bread" error={breadError}><Select id="manual-bread" value={breadId} onChange={(event) => setBreadId(event.target.value)}><option value="">Selecione</option>{product.tipos_pao?.map((bread) => <option value={bread.id} key={bread.id}>{bread.nome}</option>)}</Select></Field>}{product.adicionais?.map((item) => <Checkbox key={item.id} checked={!!additionals[item.id]} onChange={(event) => setAdditionals((current) => ({ ...current, [item.id]: event.target.checked }))}>{item.nome}</Checkbox>)}<div className="cluster"><IconButton type="button" label="Diminuir" disabled={quantity <= 1} onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus aria-hidden /></IconButton><strong>{quantity}</strong><IconButton type="button" label="Aumentar" disabled={quantity >= 50} onClick={() => setQuantity(Math.min(50, quantity + 1))}><Plus aria-hidden /></IconButton></div><Field label="Observação do item" htmlFor="manual-item-notes"><Input id="manual-item-notes" value={notes} onChange={(event) => setNotes(event.target.value)} /></Field></div>;
}

