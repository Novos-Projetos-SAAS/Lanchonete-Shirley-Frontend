import { expect, test, type Page, type Route } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";

const burger = { id: "10", categoria_id: "1", nome: "X-Bacon da Shirley", descricao: "Hambúrguer, queijo, bacon e molho da casa.", tipo: "LANCHE", preco_base: "22.00", imagem_url: null, ativo: true, disponivel_hoje: true, tipos_pao: [{ produto_id: "10", id: "2", codigo: "FRANCES", nome: "Pão francês", acrescimo: "2.50" }, { produto_id: "10", id: "1", codigo: "HAMBURGUER", nome: "Pão de hambúrguer", acrescimo: "0.00" }], adicionais: [{ produto_id: "10", id: "7", nome: "Queijo extra", descricao: "Uma fatia a mais", preco: "4.00", max_quantidade_por_item: 2 }] };
const soda = { id: "20", categoria_id: "2", nome: "Refrigerante lata", descricao: "Lata gelada.", tipo: "BEBIDA", preco_base: "6.00", imagem_url: null, ativo: true, disponivel_hoje: true, adicionais: [] };
const menu = [{ id: "1", nome: "Lanches", slug: "lanches", ativo: true, produtos: [burger] }, { id: "2", nome: "Bebidas", slug: "bebidas", ativo: true, produtos: [soda] }];
const session = { id: "1", nome: "Shirley", email: "admin@shirley.local", nivel: "ADMIN", permissoes: [] };
const invitationToken = "v".repeat(43);
const invitation = { id: "31", email: "colaborador@example.invalid", nivel_acesso_id: "2", nivel: "atendente", status: "PENDENTE", expira_em: "2026-10-30T20:00:00.000Z", aceito_em: null, revogado_em: null, criado_em: "2026-10-28T20:00:00.000Z", atualizado_em: "2026-10-28T20:00:00.000Z", criado_por_usuario_id: "1", criado_por_nome: "Shirley" };
const orders = [{ id: "101", cliente_nome: "Ana", cliente_telefone: "18999999999", tipo_entrega: "RETIRADA", status: "PENDENTE", status_pagamento: "PENDENTE", total: "28.50", versao: 1, criado_em: "2026-10-27T20:00:00.000Z", itens: [{ id: "1", quantidade: 1, produto_nome_snapshot: "X-Salada da Shirley", tipo_pao_nome_snapshot: "Pão francês", subtotal: "28.50", adicionais: [{ id: "1", nome_snapshot: "Bacon", quantidade_por_unidade: 1 }] }] }];
const ok = (data: unknown) => ({ status: "success", data });

async function mockApi(page: Page, options: { closed?: boolean; networkError?: boolean; adminCatalog?: boolean } = {}) {
  await page.route("**/api/v1/**", async (route: Route) => {
    const url = new URL(route.request().url()); const path = url.pathname;
    const cors = { "access-control-allow-origin": "http://127.0.0.1:3000", "access-control-allow-credentials": "true", "access-control-allow-headers": "content-type,idempotency-key,x-csrf-token", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS" };
    const reply = (data: unknown, status = 200) => route.fulfill({ status, json: ok(data), headers: cors });
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    if (options.networkError && path.endsWith("/cardapio")) return route.abort("failed");
    if (path.endsWith("/loja/status")) return reply({ aberta: !options.closed, mensagem: options.closed ? "Loja fechada manualmente." : "Loja aberta para pedidos.", loja: { nome_fantasia: "Lanchonete Shirley", tempo_estimado_min: 35, taxa_entrega: "5.00", endereco_trailer: "Praça central" } });
    if (path.endsWith("/cardapio")) return reply(menu);
    if (path.includes("/cardapio/produtos/")) return reply(path.endsWith("/20") ? soda : burger);
    if (path.endsWith("/metodos-pagamento")) return reply([{ id: "2", codigo: "DINHEIRO", nome: "Dinheiro" }]);
    if (path.endsWith("/pedidos") && route.request().method() === "POST") return reply({ pedido_id: "101", codigo_acompanhamento: "abcdef0123456789abcdef0123456789", status: "PENDENTE", subtotal: "28.50", taxa_entrega: "0.00", total: "28.50", criado_em: "2026-10-27T20:00:00.000Z" }, 201);
    if (path.includes("/pedidos/acompanhar/")) return reply({ codigo_acompanhamento: "abcdef0123456789abcdef0123456789", status: "EM_PREPARO", tipo_entrega: "RETIRADA", criado_em: "2026-10-27T20:00:00.000Z", tempo_estimado_min: 35 });
    if (path.endsWith("/auth/me")) return reply(session);
    if (path.endsWith("/auth/login")) return reply({ usuario: session });
    if (path.endsWith("/auth/csrf")) return reply({ csrf_token: "csrf-test" });
    if (path.endsWith("/convites/validar")) return reply({ valido: true, email_mascarado: "c***@example.invalid", nivel: "atendente", expira_em: invitation.expira_em });
    if (path.endsWith("/convites/aceitar")) return reply({ aceito: true, login_necessario: true }, 201);
    if (path.endsWith("/admin/convites/niveis-acesso")) return reply([{ id: "2", nome: "atendente", ativo: true }, { id: "3", nome: "entregador", ativo: true }]);
    if (path.endsWith("/admin/convites") && route.request().method() === "POST") return reply({ convite: invitation, token: invitationToken }, 201);
    if (path.endsWith("/admin/convites")) return reply({ items: [invitation], pagination: { page: 1, limit: 20, total: 1, total_pages: 1 } });
    if (path.endsWith("/admin/dashboard")) return reply({ pedidos_validos: 12, faturamento_realizado: "350.00", ticket_medio_realizado: "29.17", por_status: [{ status: "PENDENTE", total: "2" }, { status: "ENTREGUE", total: "10" }] });
    if (path.endsWith("/admin/pedidos")) return reply({ items: orders, pagination: { page: 1, limit: 20, total: 1, total_pages: 1 } });
    if (path.endsWith("/admin/pedidos/101")) return reply(orders[0]);
    if (path.endsWith("/admin/push/configuracao")) return reply({ habilitado: false, public_key: null });
    if (options.adminCatalog && path.endsWith("/admin/produtos")) return reply({ items: [burger], pagination: { page: 1, limit: 20, total: 1, total_pages: 1 } });
    if (options.adminCatalog && path.endsWith("/admin/tipos-pao")) return reply({ items: burger.tipos_pao, pagination: { page: 1, limit: 100, total: 2, total_pages: 1 } });
    if (options.adminCatalog && path.endsWith("/admin/adicionais")) return reply({ items: burger.adicionais, pagination: { page: 1, limit: 100, total: 1, total_pages: 1 } });
    if (options.adminCatalog && path.endsWith("/admin/produtos/10/vinculos")) return reply({ produto_id: "10", tipos_pao: [{ tipo_pao_id: "1", ativo: false, codigo: "HAMBURGUER", nome: "Pão de hambúrguer", acrescimo: "0.00" }, { tipo_pao_id: "2", ativo: true, codigo: "FRANCES", nome: "Pão francês", acrescimo: "2.50" }], adicionais: [{ adicional_id: "7", max_quantidade_por_item: 2, ativo: true, nome: "Queijo extra", preco: "4.00", disponivel_hoje: true, deletado_em: null }] });
    return reply({ items: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } });
  });
}

async function capture(page: Page, path: string, fullPage = true) {
  await page.evaluate(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.waitForTimeout(100);
  await page.screenshot({
    path,
    fullPage,
    style: ".connection-banner { display: none !important; }",
  });
}

test.beforeAll(async () => { await mkdir("docs/screenshots", { recursive: true }); });

test("fluxo público: dois itens, retorno ao cardápio e carrinho somente por ação explícita", async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /escolha seu pedido/i })).toBeVisible();
  await capture(page, "docs/screenshots/redesign-publico-cardapio-390.png");

  await page.getByPlaceholder("Buscar lanche, bebida...").fill("X-Bacon");
  await page.getByRole("button", { name: "Lanches" }).click();
  await page.getByRole("link", { name: /x-bacon/i }).click();
  await page.getByLabel("Pão francês").check();
  await page.locator(".additional-row").filter({ hasText: "Queijo extra" }).getByRole("button", { name: "Aumentar quantidade" }).click();
  await capture(page, "docs/screenshots/redesign-publico-produto-390.png");
  await page.getByRole("button", { name: /adicionar ao carrinho/i }).click();

  await expect(page).toHaveURL(/\?busca=X-Bacon&categoria=1$/);
  await expect(page.getByText("Item adicionado ao carrinho").first()).toBeVisible();
  await expect(page.locator(".cart-link")).toContainText("1");
  await expect(page.getByPlaceholder("Buscar lanche, bebida...")).toHaveValue("X-Bacon");
  await expect(page.getByRole("button", { name: "Lanches" })).toHaveAttribute("aria-current", "true");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(150);

  await page.getByRole("button", { name: "Limpar busca" }).click();
  await page.getByRole("button", { name: "Bebidas" }).click();
  await page.getByRole("link", { name: /refrigerante/i }).click();
  await page.getByRole("button", { name: /adicionar ao carrinho/i }).click();
  await expect(page).toHaveURL(/\?categoria=2$/);
  await expect(page.locator(".cart-link")).toContainText("2");

  await page.locator(".mobile-cart-bar").click();
  await expect(page).toHaveURL(/carrinho/);
  await expect(page.getByRole("heading", { name: "X-Bacon da Shirley" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Refrigerante lata" })).toBeVisible();
  await expect(page.getByText("Pão francês")).toBeVisible();
  await expect(page.getByText("1× Queijo extra")).toBeVisible();
  await capture(page, "docs/screenshots/redesign-publico-carrinho-390.png");

  await page.getByRole("link", { name: /ir para finalizar/i }).click();
  await page.getByLabel("Nome").fill("Ana");
  await page.getByLabel(/telefone com ddd/i).fill("18999999999");
  const closeToast = page.getByRole("button", { name: "Fechar aviso" }).first();
  if (await closeToast.isVisible()) await closeToast.click();
  await capture(page, "docs/screenshots/redesign-publico-checkout-390.png");
  await page.getByRole("button", { name: /confirmar pedido/i }).click();
  await expect(page.getByText(/agora é com a shirley/i)).toBeVisible();
  await capture(page, "docs/screenshots/redesign-publico-confirmacao-390.png");
});

test("acesso direto ao produto usa retorno seguro para o cardápio", async ({ page }) => {
  await mockApi(page);
  await page.goto("/produto/10");
  await page.getByLabel("Pão francês").check();
  await page.getByRole("button", { name: /adicionar ao carrinho/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Item adicionado ao carrinho")).toBeVisible();
});

test("seleção inválida permanece no produto e leva foco ao resumo", async ({ page }) => {
  await mockApi(page);
  await page.goto("/produto/10?retorno=https%3A%2F%2Fexample.com%2Ffora");
  await page.getByRole("button", { name: /adicionar ao carrinho/i }).click();
  await expect(page).toHaveURL(/\/produto\/10/);
  const summary = page.locator(".form-error-summary");
  await expect(summary).toContainText("Escolha um tipo de pão");
  await expect(summary).toBeFocused();
});

test("cliques rápidos em adicionar não duplicam o item", async ({ page }) => {
  await mockApi(page);
  await page.goto("/produto/10");
  await page.getByLabel("Pão francês").check();
  await page.getByRole("button", { name: /adicionar ao carrinho/i }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(page).toHaveURL(/\/$/);
  await page.locator(".menu-cart-summary").getByRole("link", { name: "Ver carrinho", exact: true }).click();
  await expect(page.getByLabel("1 unidade")).toBeVisible();
  await expect(page.getByRole("heading", { name: "X-Bacon da Shirley" })).toHaveCount(1);
});

test("loja fechada bloqueia checkout sem esconder o cardápio", async ({ page }) => { await mockApi(page, { closed: true }); await page.goto("/"); await expect(page.getByText("Fechada agora")).toBeVisible(); await page.goto("/finalizar"); await expect(page.getByText(/carrinho está vazio|não está aceitando/i)).toBeVisible(); });

test("erro de rede mostra recuperação explícita", async ({ page }) => { await mockApi(page, { networkError: true }); await page.goto("/"); await expect(page.getByText(/cardápio não carregou/i)).toBeVisible(); });

test("login, lista e detalhe de pedidos no painel mobile", async ({ page }) => {
  await mockApi(page); await page.setViewportSize({ width: 360, height: 800 }); await page.goto("/admin/login"); await capture(page, "docs/screenshots/login-360.png", false);
  await page.getByLabel("E-mail").fill("admin@shirley.local"); await page.locator("#login-password").fill("SenhaSegura123"); await page.getByRole("button", { name: /entrar no painel/i }).click(); await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/pedidos"); const mobileOrders = page.locator(".responsive-table__mobile"); await expect(mobileOrders.getByText("Ana")).toBeVisible(); await page.getByLabel("Status").selectOption("PENDENTE"); await expect(mobileOrders.getByText("Ana")).toBeVisible(); await capture(page, "docs/screenshots/pedidos-360.png", false); await mobileOrders.getByRole("link", { name: /detalhes/i }).click(); await expect(page.getByText("X-Salada da Shirley")).toBeVisible(); await capture(page, "docs/screenshots/pedido-detalhe-360.png", false); await page.getByLabel("Próximo status").selectOption("EM_PREPARO"); await page.getByRole("button", { name: /salvar status/i }).click(); await expect(page.getByText("Pedido atualizado")).toBeVisible();
});

test("catálogo administrativo vazio e responsivo", async ({ page }) => { const pageErrors: string[] = []; page.on("pageerror", (error) => pageErrors.push(error.stack || error.message)); page.on("console", (message) => { if (message.type() === "error") pageErrors.push(message.text()); }); await mockApi(page); await page.setViewportSize({ width: 1024, height: 768 }); await page.goto("/admin/produtos"); await page.waitForTimeout(800); expect(pageErrors).toEqual([]); await expect(page.getByText(/nenhum cadastro em produtos/i)).toBeVisible(); await capture(page, "docs/screenshots/catalogo-admin-1024.png"); });

test("editor de produto carrega vínculos atuais antes de permitir substituição", async ({ page }) => {
  await mockApi(page, { adminCatalog: true });
  await page.goto("/admin/produtos");
  const desktopTable = page.locator(".responsive-table__desktop");
  await expect(desktopTable.getByText("X-Bacon da Shirley")).toBeVisible();
  await desktopTable.getByLabel("Ações de X-Bacon da Shirley").click();
  await desktopTable.getByRole("button", { name: "Opções" }).click();
  await expect(page.getByRole("checkbox", { name: "Pão francês" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Pão de hambúrguer" })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Queijo extra" })).toBeChecked();
  await expect(page.locator(".association-row").filter({ hasText: "Queijo extra" }).getByRole("spinbutton")).toHaveValue("2");
  await expect(page.getByRole("button", { name: "Salvar vínculos" })).toBeEnabled();
});

test("convites administrativos usam tabela no desktop e cartão no mobile", async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/admin/convites");
  await expect(page.getByRole("heading", { name: "Convites" })).toBeVisible();
  await expect(page.locator(".responsive-table__desktop").getByText(invitation.email)).toBeVisible();
  await capture(page, "docs/screenshots/convites-admin-1440.png");
  await capture(page, "docs/screenshots/redesign-publico-regressao-admin-1440.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".responsive-table__mobile").getByText(invitation.email)).toBeVisible();
  await capture(page, "docs/screenshots/convites-admin-390.png");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("aceite de convite limpa o fragmento antes de exibir o formulário", async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/convite#token=${invitationToken}`);
  await expect(page.getByRole("heading", { name: "Crie sua conta" })).toBeVisible();
  await expect(page).toHaveURL(/\/convite$/);
  expect(page.url()).not.toContain(invitationToken);
  await capture(page, "docs/screenshots/convite-publico-390.png");
  await page.getByLabel("Seu nome").fill("Pessoa Convidada");
  await page.locator("#invite-password").fill("SenhaSegura123");
  await page.locator("#invite-confirm").fill("SenhaSegura123");
  await page.getByRole("button", { name: /criar conta/i }).click();
  await expect(page.getByRole("heading", { name: "Convite aceito" })).toBeVisible();
});

for (const width of [320, 768, 1440]) {
  test(`tabela administrativa sem rolagem horizontal em ${width}px`, async ({ page }) => {
    await mockApi(page);
    await page.setViewportSize({ width, height: width < 500 ? 800 : 900 });
    await page.goto("/admin/convites");
    await expect(page.getByRole("heading", { name: "Convites" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  });
}

for (const width of [320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1440]) {
  test(`fluxo público sem rolagem horizontal em ${width}px`, async ({ page }) => {
    await mockApi(page);
    await page.setViewportSize({ width, height: width < 500 ? 800 : 900 });
    await page.addInitScript(({ cart, confirmation }) => {
      localStorage.setItem("shirley.cart.v1", cart);
      sessionStorage.setItem("shirley.order.confirmation", confirmation);
    }, {
      cart: JSON.stringify({ state: { items: [{ key: "10::2::7:1::", produtoId: "10", nome: "X-Bacon da Shirley", tipo: "LANCHE", precoBase: "22.00", quantidade: 1, pao: { id: "2", nome: "Pão francês", acrescimo: "2.50" }, adicionais: [{ id: "7", nome: "Queijo extra", preco: "4.00", quantidade: 1 }] }] }, version: 0 }),
      confirmation: JSON.stringify({ codigo_acompanhamento: "abcdef0123456789abcdef0123456789", status: "PENDENTE", subtotal: "28.50", taxa_entrega: "0.00", total: "28.50" }),
    });
    for (const path of ["/", "/produto/10", "/carrinho", "/finalizar", "/pedido/confirmado", "/acompanhar", "/acompanhar/abcdef0123456789abcdef0123456789"]) {
      await page.goto(path);
      await page.waitForTimeout(80);
      const overflow = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth;
        return Array.from(document.querySelectorAll<HTMLElement>("body *")).map((element) => {
          const rect = element.getBoundingClientRect();
          return { element: `${element.tagName.toLowerCase()}.${element.className}`, left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) };
        }).filter((item) => item.left < -1 || item.right > viewport + 1).slice(0, 8);
      });
      expect(overflow, `${path} transbordou em ${width}px`).toEqual([]);
    }
  });
}

test("cardápio desktop exibe resumo lateral e mantém o painel sem regressão", async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Carrinho" })).toBeVisible();
  await capture(page, "docs/screenshots/redesign-publico-cardapio-1280.png");
  await page.goto("/acompanhar/abcdef0123456789abcdef0123456789");
  await expect(page.getByText("Em preparo")).toBeVisible();
  await capture(page, "docs/screenshots/redesign-publico-acompanhamento-1280.png");
});

test("telas públicas e login sem violações axe WCAG A/AA detectáveis", async ({ page }) => {
  await mockApi(page);
  const assertAxe = async () => {
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(result.violations).toEqual([]);
  };
  for (const [path, heading] of [["/", "Escolha seu pedido"], ["/produto/10", "X-Bacon da Shirley"], ["/acompanhar", "Acompanhar pedido"], ["/acompanhar/abcdef0123456789abcdef0123456789", "Seu pedido está andando"]]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await assertAxe();
  }
  await page.goto("/produto/10");
  await page.getByLabel("Pão francês").check();
  await page.getByRole("button", { name: /adicionar ao carrinho/i }).click();
  await page.locator(".menu-cart-summary").getByRole("link", { name: "Ver carrinho", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Carrinho", exact: true })).toBeVisible();
  await assertAxe();
  await page.getByRole("link", { name: /ir para finalizar/i }).click();
  await expect(page.getByRole("heading", { name: "Finalizar pedido", exact: true })).toBeVisible();
  await assertAxe();
  await page.evaluate(() => sessionStorage.setItem("shirley.order.confirmation", JSON.stringify({ codigo_acompanhamento: "abcdef0123456789abcdef0123456789", status: "PENDENTE", subtotal: "24.50", taxa_entrega: "0.00", total: "24.50" })));
  await page.goto("/pedido/confirmado");
  await expect(page.getByRole("heading", { name: "Agora é com a Shirley.", exact: true })).toBeVisible();
  await assertAxe();
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: "Bom turno.", exact: true })).toBeVisible();
  await assertAxe();
});

