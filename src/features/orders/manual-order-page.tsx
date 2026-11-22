"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Save, ShoppingBasket, Trash2 } from "lucide-react";
import { clearFormFieldError, toFormError, type FormErrorFeedback } from "@/lib/api-errors";
import { formatCurrency, moneyToCents, centsToMoney } from "@/lib/money";
import { queryKeys } from "@/lib/query-keys";
import { isValidBrazilianMobile, maskBrazilianMobile } from "@/lib/phone-mask";
import { adminService } from "@/services/admin-service";
import { publicService } from "@/services/public-service";
import type { CreateOrderInput, OrderItemInput, Product } from "@/types/domain";
import {
  Button,
  Card,
  Checkbox,
  Dialog,
  Drawer,
  EmptyState,
  Field,
  FormErrorSummary,
  IconButton,
  Input,
  Radio,
  Select,
  Textarea,
} from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { AdminCategoryRail, AdminProductPhoto } from "@/features/admin/catalog-workspace";

interface DraftItem extends OrderItemInput {
  key: string;
  nome: string;
  detalhe: string;
  unitCents: number;
  priceKnown: boolean;
}

const currency = (cents: number) => formatCurrency(centsToMoney(cents));

export function ManualOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const menu = useQuery({ queryKey: queryKeys.menu, queryFn: publicService.menu });
  const payments = useQuery({ queryKey: queryKeys.payments, queryFn: publicService.paymentMethods });
  const products = useMemo(
    () => (menu.data || []).flatMap((category) => category.produtos || []),
    [menu.data],
  );

  // Configuração individual: abre ao selecionar um card do catálogo.
  const [productId, setProductId] = useState("");
  const [configOpen, setConfigOpen] = useState(false);
  const [breadId, setBreadId] = useState("");
  const [additionals, setAdditionals] = useState<Record<string, boolean>>({});
  const [itemQty, setItemQty] = useState(1);
  const [itemNotes, setItemNotes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [categoryId, setCategoryId] = useState("");

  // Carrinho flutuante (tablet/celular) e etapa final de criação.
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Dados do cliente só aparecem quando o operador clica em Criar pedido.
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [delivery, setDelivery] = useState<"ENTREGA" | "RETIRADA">("RETIRADA");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [noNumber, setNoNumber] = useState(false);
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("SP");
  const [paymentId, setPaymentId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<FormErrorFeedback | null>(null);

  const visibleProducts = categoryId
    ? menu.data?.find((category) => category.id === categoryId)?.produtos || []
    : products;
  const selected = products.find((product) => product.id === productId);
  const storeStatus = useQuery({
    queryKey: queryKeys.storeStatus,
    queryFn: publicService.status,
    enabled: delivery === "ENTREGA" && items.length > 0,
  });

  const itemCount = items.reduce((sum, item) => sum + item.quantidade, 0);
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.unitCents * item.quantidade,
    0,
  );
  const subtotalKnown = items.every((item) => item.priceKnown);
  const deliveryFee = delivery === "ENTREGA" ? storeStatus.data?.loja?.taxa_entrega : "0.00";
  const deliveryKnown = delivery !== "ENTREGA" || (storeStatus.isSuccess && deliveryFee != null);
  const deliveryCents = moneyToCents(deliveryFee);
  const totalKnown = subtotalKnown && deliveryKnown;
  const totalCents = subtotalCents + deliveryCents;

  function reportError(message: string, fields: Record<string, string> = {}) {
    setError({ message, fields });
  }

  function clearError(field: string) {
    setError((current) => clearFormFieldError(current, field));
  }

  function selectProduct(id: string) {
    setProductId(id);
    setBreadId("");
    setAdditionals({});
    setItemQty(1);
    setItemNotes("");
    setError(null);
  }

  function openProduct(id: string) {
    selectProduct(id);
    clearError("itens");
    setConfigOpen(true);
  }

  function closeProduct() {
    setConfigOpen(false);
    selectProduct("");
  }

  function addItem() {
    if (!selected) return;
    if (selected.tipo === "LANCHE" && !breadId) {
      reportError("Revise o item antes de adicionar.", {
        tipo_pao_id: "Escolha o pão do lanche.",
      });
      return;
    }

    const bread = (selected.tipos_pao || selected.paes || []).find(
      (option) => option.id === breadId,
    );
    const extras = (selected.adicionais || []).filter((item) => additionals[item.id]);
    const unitCents = moneyToCents(selected.preco_base)
      + moneyToCents(bread?.acrescimo)
      + extras.reduce((sum, item) => sum + moneyToCents(item.preco), 0);
    const priceKnown = selected.preco_base != null && extras.every((item) => item.preco != null);

    setItems((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        produto_id: selected.id,
        quantidade: itemQty,
        tipo_pao_id: breadId || null,
        adicionais: extras.map((item) => ({ adicional_id: item.id, quantidade: 1 })),
        observacoes: itemNotes || null,
        nome: selected.nome,
        detalhe: [bread?.nome, ...extras.map((item) => item.nome)]
          .filter(Boolean)
          .join(" · ") || "Configuração padrão",
        unitCents,
        priceKnown,
      },
    ]);
    closeProduct();
  }

  function openCheckout() {
    if (!items.length || saving) return;
    setCartOpen(false);
    setCheckoutOpen(true);
    setError(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError(null);

    const requiredFields = {
      ...(!name.trim() ? { nome: "Informe o nome do cliente." } : {}),
      ...(!/^\+?[0-9 ()-]{10,20}$/.test(phone) ? { telefone: "Informe um telefone com DDD." } : {}),
      ...(!paymentId ? { metodo_pagamento_id: "Escolha a forma de pagamento." } : {}),
      ...(!items.length ? { itens: "Adicione pelo menos um item." } : {}),
    };
    if (Object.keys(requiredFields).length) {
      reportError("Preencha os dados necessários para criar o pedido.", requiredFields);
      setCheckoutOpen(true);
      return;
    }

    if (delivery === "ENTREGA" && (!street || !district || !city || (!number && !noNumber))) {
      reportError("Complete o endereço de entrega.", {
        ...(!street ? { logradouro: "Informe a rua." } : {}),
        ...(!district ? { bairro: "Informe o bairro." } : {}),
        ...(!city ? { cidade: "Informe a cidade." } : {}),
        ...(!number && !noNumber ? { numero: "Informe o número ou marque sem número." } : {}),
      });
      setCheckoutOpen(true);
      return;
    }

    const body: CreateOrderInput = {
      cliente: { nome: name, telefone: phone },
      tipo_entrega: delivery,
      endereco: delivery === "ENTREGA" ? {
        logradouro: street,
        numero: number || null,
        sem_numero: noNumber,
        bairro: district,
        cidade: city,
        uf: uf.toUpperCase(),
      } : null,
      metodo_pagamento_id: paymentId,
      precisa_troco: false,
      troco_para: null,
      observacoes: notes || null,
      itens: items.map((item) => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        tipo_pao_id: item.tipo_pao_id,
        adicionais: item.adicionais,
        observacoes: item.observacoes,
      })),
    };

    setSaving(true);
    try {
      const result = await adminService.createOrder(body);
      toast({ tone: "success", title: "Pedido manual criado" });
      router.push(`/admin/pedidos/${result.pedido_id}`);
    } catch (cause) {
      setError(toFormError(cause, {
        fallback: "Não foi possível criar o pedido.",
        aliases: {
          "cliente.nome": "nome",
          "cliente.telefone": "telefone",
          "endereco.logradouro": "logradouro",
          "endereco.numero": "numero",
          "endereco.bairro": "bairro",
          "endereco.cidade": "cidade",
          "endereco.uf": "uf",
        },
      }));
      setCheckoutOpen(true);
    } finally {
      setSaving(false);
    }
  }

  const fieldIds = {
    nome: "manual-name",
    telefone: "manual-phone",
    logradouro: "manual-street",
    numero: "manual-number",
    bairro: "manual-district",
    cidade: "manual-city",
    uf: "manual-uf",
    itens: "manual-product",
    tipo_pao_id: "manual-bread",
    metodo_pagamento_id: "manual-payment",
  };

  // Mesmo resumo no desktop e no carrinho flutuante do celular.
  const orderSummary = (
    <>
      {items.length ? (
        <div className="manual-items">
          {items.map((item) => (
            <div className="manual-order-line" key={item.key}>
              <div className="manual-order-line__info">
                <strong>{item.quantidade}× {item.nome}</strong>
                <small>{item.detalhe}</small>
                {item.observacoes && <small>Obs.: {item.observacoes}</small>}
                <span className="manual-order-line__price">
                  {item.priceKnown
                    ? currency(item.unitCents * item.quantidade)
                    : "Preço a confirmar"}
                </span>
              </div>
              <IconButton
                type="button"
                label={`Remover ${item.nome}`}
                className="manual-order-remove"
                onClick={() => setItems((current) => current.filter((row) => row.key !== item.key))}
              >
                <Trash2 aria-hidden />
              </IconButton>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">Nenhum item adicionado.</p>
      )}
      <div className="manual-order-totals" aria-live="polite">
        <div>
          <span>Subtotal ({itemCount} {itemCount === 1 ? "item" : "itens"})</span>
          <strong>{subtotalKnown ? currency(subtotalCents) : "A confirmar"}</strong>
        </div>
        <div>
          <span>{delivery === "ENTREGA" ? "Entrega" : "Retirada"}</span>
          <strong>{deliveryKnown ? currency(deliveryCents) : "A confirmar"}</strong>
        </div>
        <div className="manual-order-totals__total">
          <span>Total estimado</span>
          <strong>{totalKnown ? currency(totalCents) : "A confirmar"}</strong>
        </div>
        <p>Estimativa do cardápio. O servidor confirma preços e taxas ao criar o pedido.</p>
      </div>
    </>
  );

  return (
    <div className="manual-order-workspace">
      <form id="manual-order-form" className="manual-workspace" onSubmit={submit} noValidate>
        <AdminCategoryRail
          categories={menu.data || []}
          value={categoryId}
          onChange={setCategoryId}
          loading={menu.isLoading}
          failed={menu.isError}
          retry={() => { void menu.refetch(); }}
        />

        <div className="manual-content stack">
          <section className="manual-catalog" aria-label="Selecionar produto para o pedido">
            <div className="catalog-heading">
              <div>
                <span className="admin-kicker">Balcão Shirley</span>
                <h1>Novo pedido manual</h1>
                <p>Selecione os produtos. Configure cada item no modal e confira o resumo antes de criar o pedido.</p>
              </div>
            </div>
            <div className="catalog-grid">
              {visibleProducts.map((product) => (
                <button
                  className="catalog-card catalog-card__open"
                  type="button"
                  key={product.id}
                  aria-pressed={configOpen && productId === product.id}
                  onClick={() => openProduct(product.id)}
                >
                  <AdminProductPhoto product={product} />
                  <span className="catalog-card__info">
                    <strong className="catalog-card__name">{product.nome}</strong>
                    {product.descricao && <span className="catalog-card__description">{product.descricao}</span>}
                    {product.preco_base != null && <span className="catalog-card__price">{formatCurrency(product.preco_base)}</span>}
                    <span className="catalog-card__edit">Selecionar <Plus aria-hidden /></span>
                  </span>
                </button>
              ))}
            </div>
            {!menu.isLoading && !menu.isError && !visibleProducts.length && (
              <EmptyState
                compact
                title="Nenhum produto nesta categoria"
                description="Escolha outra categoria para continuar."
              />
            )}
          </section>
        </div>

        <Card className="sticky-summary manual-order-summary">
          <h2>Itens do pedido</h2>
          {orderSummary}
          <Button type="button" onClick={openCheckout} full size="lg" disabled={!items.length || saving}>
            <Save aria-hidden /> Criar pedido
          </Button>
        </Card>
      </form>

      {/* A configuração é um modal, e não uma seção longa da página. */}
      <Dialog
        open={configOpen && Boolean(selected)}
        onOpenChange={(open) => { if (!open) closeProduct(); }}
        title={selected ? `Configurar item · ${selected.nome}` : "Configurar item"}
        description="Escolha pão, adicionais, quantidade e observações."
        footer={
          <>
            <Button type="button" variant="ghost" onClick={closeProduct}>Cancelar</Button>
            <Button type="button" disabled={!selected} onClick={addItem}>
              <Plus aria-hidden /> Adicionar item
            </Button>
          </>
        }
      >
        <div className="manual-order-config">
          {selected && (
            <>
              <p className="manual-order-config__name">{selected.nome}</p>
              <ProductOptions
                product={selected}
                breadId={breadId}
                setBreadId={(id) => { setBreadId(id); clearError("tipo_pao_id"); }}
                breadError={error?.fields.tipo_pao_id}
                additionals={additionals}
                setAdditionals={setAdditionals}
                quantity={itemQty}
                setQuantity={setItemQty}
                notes={itemNotes}
                setNotes={setItemNotes}
              />
            </>
          )}
          {error?.fields.tipo_pao_id && <p className="field__error" role="alert">{error.fields.tipo_pao_id}</p>}
        </div>
      </Dialog>

      {/* No mobile/tablet, abre o carrinho sem voltar ao topo ou ao fim da página. */}
      {items.length > 0 && (
        <Drawer
          open={cartOpen}
          onOpenChange={setCartOpen}
          title="Itens do pedido"
          description="Confira os itens e prossiga para os dados do cliente."
          trigger={
            <button type="button" className="manual-order-floating-cart" aria-label={`Ver carrinho com ${itemCount} itens`}>
              <ShoppingBasket aria-hidden />
              <span className="manual-order-floating-cart__count">{itemCount} {itemCount === 1 ? "item" : "itens"}</span>
              <strong>{totalKnown ? currency(totalCents) : "A confirmar"}</strong>
              <span className="manual-order-floating-cart__action">Ver pedido</span>
            </button>
          }
          footer={
            <Button type="button" full size="lg" onClick={openCheckout} disabled={!items.length || saving}>
              <Save aria-hidden /> Criar pedido
            </Button>
          }
        >
          <div className="manual-order-drawer">{orderSummary}</div>
        </Drawer>
      )}

      {/* Cliente, recebimento e pagamento aparecem SOMENTE aqui. */}
      <Dialog
        open={checkoutOpen}
        onOpenChange={(open) => { if (!saving) setCheckoutOpen(open); }}
        title="Criar pedido"
        description="Informe os dados do cliente, o recebimento e o pagamento para confirmar."
        footer={
          <>
            <Button type="button" variant="ghost" disabled={saving} onClick={() => setCheckoutOpen(false)}>
              Voltar
            </Button>
            <Button type="submit" form="manual-order-form" disabled={!items.length || saving} loading={saving}>
              <Save aria-hidden /> Confirmar pedido
            </Button>
          </>
        }
      >
        <div className="manual-order-checkout stack">
          <FormErrorSummary error={error} fieldIds={fieldIds} />
          <section className="manual-order-checkout__section">
            <h3>Cliente e recebimento</h3>
            <fieldset className="manual-fieldset">
              <legend>Dados do cliente</legend>
              <p>Identificação utilizada pela equipe durante o atendimento.</p>
              <div className="form-grid form-grid--2">
                <Field label="Nome" htmlFor="manual-name" required error={error?.fields.nome}>
                  <Input id="manual-name" autoComplete="name" value={name} onChange={(event) => { setName(event.target.value); clearError("nome"); }} />
                </Field>
                <Field label="Telefone" htmlFor="manual-phone" required hint="Informe DDD e número." error={error?.fields.telefone}>
                  <Input id="manual-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => { setPhone(event.target.value); clearError("telefone"); }} />
                </Field>
              </div>
            </fieldset>
            <fieldset className="manual-fieldset">
              <legend>Recebimento</legend>
              <p>Escolha como o cliente receberá o pedido.</p>
              <div className="delivery-options">
                <Radio name="manual-delivery" value="RETIRADA" checked={delivery === "RETIRADA"} onChange={() => setDelivery("RETIRADA")}>Retirada</Radio>
                <Radio name="manual-delivery" value="ENTREGA" checked={delivery === "ENTREGA"} onChange={() => setDelivery("ENTREGA")}>Entrega</Radio>
              </div>
              {delivery === "ENTREGA" && (
                <div className="form-grid form-grid--2 manual-address">
                  <Field label="Rua" htmlFor="manual-street" required error={error?.fields.logradouro}>
                    <Input id="manual-street" autoComplete="street-address" value={street} onChange={(event) => { setStreet(event.target.value); clearError("logradouro"); }} />
                  </Field>
                  <Field label="Número" htmlFor="manual-number" error={error?.fields.numero}>
                    <Input id="manual-number" inputMode="numeric" value={number} onChange={(event) => { setNumber(event.target.value); clearError("numero"); }} />
                  </Field>
                  <Checkbox checked={noNumber} onChange={(event) => setNoNumber(event.target.checked)}>Sem número</Checkbox>
                  <Field label="Bairro" htmlFor="manual-district" required error={error?.fields.bairro}>
                    <Input id="manual-district" value={district} onChange={(event) => { setDistrict(event.target.value); clearError("bairro"); }} />
                  </Field>
                  <Field label="Cidade" htmlFor="manual-city" required error={error?.fields.cidade}>
                    <Input id="manual-city" autoComplete="address-level2" value={city} onChange={(event) => { setCity(event.target.value); clearError("cidade"); }} />
                  </Field>
                  <Field label="UF" htmlFor="manual-uf" required error={error?.fields.uf}>
                    <Input id="manual-uf" autoComplete="address-level1" maxLength={2} value={uf} onChange={(event) => { setUf(event.target.value); clearError("uf"); }} />
                  </Field>
                </div>
              )}
            </fieldset>
          </section>

          <section className="manual-order-checkout__section">
            <h3>Pagamento e observações</h3>
            <Field label="Forma de pagamento" htmlFor="manual-payment" required error={error?.fields.metodo_pagamento_id}>
              <Select id="manual-payment" value={paymentId} onChange={(event) => { setPaymentId(event.target.value); clearError("metodo_pagamento_id"); }}>
                <option value="">Selecione</option>
                {payments.data?.map((method) => <option key={method.id} value={method.id}>{method.nome}</option>)}
              </Select>
            </Field>
            <Field label="Observações" htmlFor="manual-notes">
              <Textarea id="manual-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </Field>
          </section>
          <div className="manual-order-checkout__total">
            <span>Total estimado</span>
            <strong>{totalKnown ? currency(totalCents) : "A confirmar"}</strong>
            <small>Valor definitivo confirmado pelo servidor ao criar o pedido.</small>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function ProductOptions({
  product,
  breadId,
  setBreadId,
  breadError,
  additionals,
  setAdditionals,
  quantity,
  setQuantity,
  notes,
  setNotes,
}: {
  product: Product;
  breadId: string;
  setBreadId: (id: string) => void;
  breadError?: string;
  additionals: Record<string, boolean>;
  setAdditionals: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  quantity: number;
  setQuantity: (value: number) => void;
  notes: string;
  setNotes: (value: string) => void;
}) {
  const breads = product.tipos_pao || product.paes || [];
  return (
    <div className="manual-product-options">
      {product.tipo === "LANCHE" && (
        <Field label="Pão obrigatório" htmlFor="manual-bread" error={breadError}>
          <Select id="manual-bread" value={breadId} onChange={(event) => setBreadId(event.target.value)}>
            <option value="">Selecione</option>
            {breads.map((bread) => (
              <option value={bread.id} key={bread.id}>
                {bread.nome}{moneyToCents(bread.acrescimo) ? ` (+ ${formatCurrency(bread.acrescimo)})` : ""}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {product.adicionais?.map((item) => (
        <Checkbox
          key={item.id}
          checked={!!additionals[item.id]}
          onChange={(event) => setAdditionals((current) => ({
            ...current,
            [item.id]: event.target.checked,
          }))}
        >
          {item.nome} {moneyToCents(item.preco) ? `(+ ${formatCurrency(item.preco)})` : ""}
        </Checkbox>
      ))}
      <div className="manual-order-qty">
        <span>Quantidade</span>
        <div className="cluster">
          <IconButton type="button" label="Diminuir" disabled={quantity <= 1} onClick={() => setQuantity(Math.max(1, quantity - 1))}>
            <Minus aria-hidden />
          </IconButton>
          <strong>{quantity}</strong>
          <IconButton type="button" label="Aumentar" disabled={quantity >= 50} onClick={() => setQuantity(Math.min(50, quantity + 1))}>
            <Plus aria-hidden />
          </IconButton>
        </div>
      </div>
      <Field label="Observação do item" htmlFor="manual-item-notes">
        <Input id="manual-item-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </Field>
    </div>
  );
}
