import { randomBytes, randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test, type APIResponse, type Page } from "@playwright/test";

// Opt-in: usa apenas uma base local vazia, já preparada, com TLS e identidade distintos.
// O transporte InfinitePay é simulado; o Express, PostgreSQL e frontend são reais.
test.skip(process.env.RUN_DB_INTEGRATION !== "true", "Exige PostgreSQL descartável autorizado e preparado.");
test.describe.configure({ mode: "serial" });
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3347/api/v1";
const siteUrl = "http://127.0.0.1:3100";
type LinkPayload = { order_nsu: string; handle: string; redirect_url: string; items: Array<{ price: number; quantity: number }>; options: { single_payment: boolean; payment_methods_enabled: string[]; valid_until: string } };
type SimulatedCheckout = { payload: LinkPayload; transaction_nsu: string; slug: string; paid: boolean; method: string };
type CreatedOrder = { pedido_id: string; codigo_acompanhamento: string; pagamento: { fluxo: string; order_nsu: string; tentativa_id: string; estado: string } };

async function startBackend() {
  const api = new URL(apiUrl);
  if (!process.env.NEXT_PUBLIC_API_URL || api.hostname !== "127.0.0.1" || api.protocol !== "http:" || !api.port || api.port === "3333" || api.pathname !== "/api/v1") throw new Error("E2E exige NEXT_PUBLIC_API_URL em 127.0.0.1 e porta exclusiva; nunca use a API DEV 3333.");
  for (const name of ["DATABASE_URL", "DATABASE_TEST_URL"]) {
    const url = new URL(process.env[name] ?? "");
    if (!["127.0.0.1", "localhost"].includes(url.hostname)) throw new Error("E2E financeiro bloqueado: somente PostgreSQL local descartável.");
  }
  if (!new URL(process.env.DATABASE_TEST_URL!).pathname.includes("checkout_mvp")) throw new Error("Use base exclusiva checkout_mvp, nunca DEV ou uma base compartilhada.");
  Object.assign(process.env, {
    NODE_ENV: "test", INTEGRATION_SOURCE_NODE_ENV: "development", LOG_LEVEL: "silent", DB_POOL_MAX: "4",
    ALLOWED_ORIGINS: `${siteUrl},https://shirley-checkout.example.invalid`,
    JWT_SECRET: randomBytes(48).toString("base64url"), INFINITEPAY_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
    PRINT_AGENT_TOKEN: randomBytes(32).toString("base64url"), PUSH_ENABLED: "false", R2_ENABLED: "false", QZ_ENABLED: "false",
  });
  const backend = resolve(process.cwd(), "../Lanchonete-Shirley-Backend");
  const load = (file: string) => import(pathToFileURL(resolve(backend, file)).href);
  const helpers = await load("tests/helpers/integrationDatabase.js");
  const db = helpers.createIntegrationDatabase();
  await helpers.assertPreparedIntegrationDatabase(db);
  if (Number((await db("pedidos").count("* as total").first()).total) !== 0) throw new Error("A base descartável precisa estar sem pedidos antes da fixture.");
  const fixture = await helpers.createIntegrationFixture(db);
  await db("horarios_funcionamento").update({ ativo: false });
  await fixture.updateStore({ aceitar_pedidos: true, modo_operacao: "ABERTO_MANUAL", imprimir_automaticamente: true, metodo_impressao: "AGENTE_LEGADO", nome_impressora: "Simulada, sem agente físico" });
  const { encryptApiKey } = await load("src/payments/infinitepayCredentials.js");
  const [credential] = await db("infinitepay_credenciais").insert({ handle: "fixture-checkout", api_key_ciphertext: encryptApiKey("inchk_fixture_simulada", process.env.INFINITEPAY_ENCRYPTION_KEY, "fixture-checkout") }).returning("id");
  await db("infinitepay_configuracoes").where({ id: 1 }).update({ ativo: true, pix_habilitado: true, credito_habilitado: true, handle: "fixture-checkout", credencial_id: credential.id, backend_public_url: "https://shirley-api.example.invalid", redirect_url: "https://shirley-checkout.example.invalid/pedido/confirmado" });
  const methods: Array<{ id: string; codigo: string }> = await db("metodos_pagamento").select("id", "codigo");
  const checkouts = new Map<string, SimulatedCheckout>();
  const state = { links: 0, checks: 0, failNextLink: false };
  const { InfinitepayClient } = await load("src/payments/infinitepayClient.js");
  const { infinitepayPaymentService } = await load("src/services/infinitepayPaymentService.js");
  const original = infinitepayPaymentService.client;
  infinitepayPaymentService.client = new InfinitepayClient(async (url: string, init: RequestInit) => {
    expect(init.redirect).toBe("error");
    expect((init.headers as Record<string, string>)["X-Api-Key"]).toBe("inchk_fixture_simulada");
    const input = JSON.parse(init.body as string);
    if (url === "https://api.checkout.infinitepay.io/links") {
      state.links++;
      const payload = input as LinkPayload;
      checkouts.set(payload.order_nsu, { payload, transaction_nsu: randomUUID(), slug: randomUUID(), paid: false, method: "pix" });
      if (state.failNextLink) { state.failNextLink = false; throw new Error("Timeout simulado após criação remota"); }
      return Response.json({ url: `https://buy.infinitepay.io/fixture/${payload.order_nsu}` });
    }
    if (url === "https://api.checkout.infinitepay.io/payment_check") {
      state.checks++;
      const checkout = checkouts.get(input.order_nsu);
      if (!checkout || input.transaction_nsu !== checkout.transaction_nsu || input.slug !== checkout.slug) return Response.json({ success: false, paid: false });
      const amount = checkout.payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      return Response.json({ success: true, paid: checkout.paid, amount, paid_amount: amount + (checkout.method === "credit_card" ? 20 : 0), capture_method: checkout.method, installments: checkout.method === "credit_card" ? 2 : 1, handle: checkout.payload.handle, ...input });
    }
    throw new Error("Requisição financeira inesperada bloqueada");
  });
  const { app } = await load("src/app.js");
  const { env } = await load("src/config/env.js");
  expect(env.NODE_ENV).toBe("test");
  expect(env.DATABASE_TEST_URL).toBe(process.env.DATABASE_TEST_URL);
  expect(env.allowedOrigins).toContain(siteUrl);
  const server = await new Promise<import("node:http").Server>((done, reject) => {
    const instance = app.listen(Number(api.port), "127.0.0.1", () => done(instance));
    instance.once("error", reject);
  });
  const { attachSocket } = await load("src/realtime/socket.js");
  const io = attachSocket(server);
  return {
    db, fixture, methods, checkouts, state,
    async processSignals() {
      await infinitepayPaymentService.processInbox();
      const { domainOutboxService } = await load("src/services/domainOutboxService.js");
      await domainOutboxService.flush();
    },
    async effects(id: string) {
      const counts: Record<string, number> = {};
      for (const table of ["notificacoes", "impressoes", "eventos_outbox", "infinitepay_transacoes", "infinitepay_confirmacoes"]) counts[table] = Number((await db(table).where({ pedido_id: id }).count("* as total").first()).total);
      return counts;
    },
    async close() {
      infinitepayPaymentService.client = original;
      await new Promise<void>((done) => io.close(() => done()));
      const { closeDb } = await load("src/database/connection.js");
      await closeDb();
      await db.destroy();
      // O ledger é imutável. A fixture permanece somente nesta base descartável.
    },
  };
}

let backend: Awaited<ReturnType<typeof startBackend>>;
let phone = 11900000000;
test.beforeAll(async () => { backend = await startBackend(); });
test.afterAll(async () => { if (backend) await backend.close(); });

async function checkout(page: Page, method: string, online = true) {
  await page.route("https://buy.infinitepay.io/fixture/**", (route) => route.fulfill({ contentType: "text/html; charset=utf-8", body: "<html lang='pt-BR'><meta charset='utf-8'><title>Checkout simulado</title><h1>Checkout InfinitePay simulado</h1><p>Nenhuma cobrança real.</p><a href='#'>Voltar à loja</a></html>" }));
  const response = new Promise<{ response: APIResponse; order: CreatedOrder; key: string; body: unknown }>((done) => {
    page.route("**/api/v1/pedidos", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      // Captura antes da navegação externa, preservando integralmente a resposta da API real.
      const response = await route.fetch();
      const result = await response.json();
      done({ response, order: result.data, key: route.request().headers()["idempotency-key"], body: route.request().postDataJSON() });
      await route.fulfill({ response });
    });
  });
  await page.goto(`/produto/${backend.fixture.catalog.product.id}`);
  await page.getByLabel(backend.fixture.catalog.hamburger.nome, { exact: false }).check();
  await page.getByRole("button", { name: /adicionar ao carrinho/i }).click();
  await page.goto("/carrinho");
  await page.getByRole("link", { name: /ir para finalizar/i }).click();
  await page.locator("#nome").fill("Cliente de homologação");
  await page.getByLabel(/telefone com ddd/i).fill(String(phone++));
  const selected = backend.methods.find((item) => item.codigo === method)!;
  await page.getByLabel("Forma de pagamento").selectOption(selected.id);
  await page.getByRole("button", { name: method === "DINHEIRO" || !online ? "Confirmar pedido" : "Ir para pagamento seguro", exact: true }).click();
  const created = await response;
  expect([201, 202]).toContain(created.response.status());
  if (created.order.pagamento.fluxo === "INFINITEPAY" && created.order.pagamento.estado === "AGUARDANDO_PAGAMENTO") {
    await expect(page).toHaveURL(/^https:\/\/buy\.infinitepay\.io\/fixture\//);
    await expect(page.getByRole("heading", { name: "Checkout InfinitePay simulado" })).toBeVisible();
  }
  return created;
}

async function returnToStore(page: Page, payment: SimulatedCheckout) {
  const target = new URL(payment.payload.redirect_url);
  target.searchParams.set("order_nsu", payment.payload.order_nsu);
  target.searchParams.set("transaction_nsu", payment.transaction_nsu);
  target.searchParams.set("slug", payment.slug);
  // Alias HTTPS do retorno configurado, resolvido apenas pelo navegador de teste.
  const local = new URL(target.pathname + target.search, siteUrl).href;
  await page.locator("a").evaluate((anchor, url) => { anchor.setAttribute("href", url); }, local);
  await page.getByRole("link", { name: "Voltar à loja" }).click();
}

for (const [method, capture] of [["PIX", "pix"], ["CREDITO", "credit_card"], ["PIX", "credit_card"]]) {
  test(`checkout ${method}, confirmação ${capture}, replay sem duplicação`, async ({ page, request }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const before = backend.state.links;
    const { order, key, body } = await checkout(page, method);
    await expect(page).toHaveURL(/^https:\/\/buy\.infinitepay\.io\/fixture\//);
    const payment = backend.checkouts.get(order.pagamento.order_nsu)!;
    expect(payment.payload.options.single_payment).toBe(true);
    expect(payment.payload.options.payment_methods_enabled).toEqual(method === "PIX" ? ["pix", "credit_card"] : ["credit_card"]);
    expect(await backend.effects(order.pedido_id)).toEqual({ notificacoes: 0, impressoes: 0, eventos_outbox: 0, infinitepay_transacoes: 0, infinitepay_confirmacoes: 0 });
    const replay = await request.post(`${apiUrl}/pedidos`, { headers: { "Idempotency-Key": key }, data: body });
    expect(replay.status()).toBe(200);
    expect((await replay.json()).data.pedido_id).toBe(order.pedido_id);
    expect(backend.state.links).toBe(before + 1);
    payment.paid = true; payment.method = capture;
    await returnToStore(page, payment);
    await expect(page.getByRole("heading", { name: "Pagamento confirmado", exact: true })).toBeVisible();
    await expect(page.getByText("Na chapa", { exact: true })).toBeVisible();
    const effects = await backend.effects(order.pedido_id);
    expect(effects.impressoes).toBe(1);
    expect(effects.notificacoes).toBeGreaterThan(0);
    expect(effects.infinitepay_transacoes).toBe(1);
    expect(effects.infinitepay_confirmacoes).toBe(1);
    const ledger = await backend.db("infinitepay_transacoes").where({ pedido_id: order.pedido_id }).first();
    expect(ledger.capture_method).toBe(capture);
    expect(Number(ledger.paid_amount)).toBe(Number(ledger.amount) + (capture === "credit_card" ? 20 : 0));
    await page.reload();
    await expect(page.getByRole("heading", { name: "Pagamento confirmado", exact: true })).toBeVisible();
    expect(await backend.effects(order.pedido_id)).toEqual(effects);
    expect(backend.state.links).toBe(before + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath("pagamento-confirmado-mobile.png"), fullPage: true });
  });
}

test("retorno pendente ou recusado não libera; consulta não cria cobrança", async ({ page }) => {
  const { order } = await checkout(page, "PIX");
  await expect(page).toHaveURL(/^https:\/\/buy\.infinitepay\.io/);
  const payment = backend.checkouts.get(order.pagamento.order_nsu)!;
  await returnToStore(page, payment);
  await expect(page.getByRole("heading", { name: "Aguardando pagamento", exact: true })).toBeVisible();
  await expect(page.getByText("Na chapa", { exact: true })).toHaveCount(0);
  const links = backend.state.links;
  await page.getByRole("button", { name: "Atualizar", exact: true }).click();
  expect(backend.state.links).toBe(links);
  expect((await backend.effects(order.pedido_id)).impressoes).toBe(0);
  expect((await backend.effects(order.pedido_id)).notificacoes).toBe(0);
});

test("paid=true adulterado e checkout expirado não liberam produção", async ({ page }) => {
  const { order } = await checkout(page, "PIX");
  await page.goto(`/acompanhar/${order.codigo_acompanhamento}?paid=true&status=PAGO`);
  await expect(page.getByRole("heading", { name: "Aguardando pagamento", exact: true })).toBeVisible();
  await backend.db("infinitepay_tentativas").where({ id: order.pagamento.tentativa_id }).update({ estado: "EXPIRADO" });
  await page.getByRole("button", { name: "Atualizar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Checkout expirado", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Abrir checkout seguro" })).toHaveCount(0);
  expect((await backend.effects(order.pedido_id)).eventos_outbox).toBe(0);
});

test("timeout de criação preserva pedido e não repete links", async ({ page }) => {
  backend.state.failNextLink = true;
  const links = backend.state.links;
  const { order, response } = await checkout(page, "CREDITO");
  expect(response.status()).toBe(202);
  expect(order.pagamento.estado).toBe("CRIACAO_INCERTA");
  await expect(page.getByRole("heading", { name: "Checkout indisponível", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Atualizar", exact: true }).click();
  expect(backend.state.links).toBe(links + 1);
  expect((await backend.effects(order.pedido_id)).impressoes).toBe(0);
});

test("dinheiro mantém confirmação e efeitos tradicionais", async ({ page }) => {
  const links = backend.state.links;
  const { order } = await checkout(page, "DINHEIRO");
  await expect(page.getByRole("heading", { name: "Agora é com a Shirley." })).toBeVisible();
  expect(order.pagamento.fluxo).toBe("TRADICIONAL");
  expect((await backend.effects(order.pedido_id)).notificacoes).toBeGreaterThan(0);
  expect((await backend.effects(order.pedido_id)).impressoes).toBe(1);
  expect(backend.state.links).toBe(links);
});

test("InfinitePay desligada preserva Pix tradicional", async ({ page }) => {
  await backend.db("infinitepay_configuracoes").where({ id: 1 }).update({ ativo: false, pix_habilitado: false, credito_habilitado: false });
  try {
    const links = backend.state.links;
    const { order } = await checkout(page, "PIX", false);
    await expect(page.getByRole("heading", { name: "Agora é com a Shirley." })).toBeVisible();
    expect(order.pagamento.fluxo).toBe("TRADICIONAL");
    expect((await backend.effects(order.pedido_id)).impressoes).toBe(1);
    expect(backend.state.links).toBe(links);
  } finally {
    await backend.db("infinitepay_configuracoes").where({ id: 1 }).update({ ativo: true, pix_habilitado: true, credito_habilitado: true });
  }
});

test("health e dashboard administrativo autenticado retornam HTTP 200", async ({ request }) => {
  expect((await request.get(`${apiUrl}/health`)).status()).toBe(200);
  const login = await request.post(`${apiUrl}/auth/login`, { headers: { Origin: siteUrl }, data: { email: backend.fixture.credentials.admin.email, senha: backend.fixture.credentials.admin.password } });
  expect(login.status()).toBe(200);
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const dashboard = await request.get(`${apiUrl}/admin/dashboard?data_inicio=${date}&data_fim=${date}`);
  expect(dashboard.status()).toBe(200);
  const data = (await dashboard.json()).data;
  expect(data.pedidos_validos).toBe(5);
  expect(data.faturamento_realizado).toBe("0.00");
  expect(data.pedidos_realizados).toBe(0);
});

test("painel InfinitePay salva configuração, aplica modalidades e confirma somente pela consulta oficial", async ({ page }) => {
  test.setTimeout(60_000);
  const adminSite = siteUrl;
  const context = page.context().request;
  const configurationUrl = "/api/v1/admin/pagamentos/infinitepay/configuracao";
  const preflight = await context.fetch(`${apiUrl}/auth/login`, { method: "OPTIONS", headers: { Origin: adminSite, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type" } });
  expect(preflight.status()).toBe(204);
  expect(preflight.headers()["access-control-allow-origin"]).toBe(adminSite);
  await page.goto(`${adminSite}/admin/login`);
  await page.getByLabel("E-mail").fill(backend.fixture.credentials.admin.email);
  await page.locator("#login-password").fill(backend.fixture.credentials.admin.password);
  await page.getByRole("button", { name: /entrar no painel/i }).click();
  await expect(page).toHaveURL(`${adminSite}/admin`);
  await page.goto(`${adminSite}/admin/metodos-pagamento`);
  await expect(page.getByLabel("API Key", { exact: true })).toHaveValue("");
  await expect(page.getByText("API Key cadastrada no backend.")).toBeVisible();
  await page.getByLabel("Ativar InfinitePay", { exact: true }).uncheck();
  await page.getByLabel("Habilitar Pix", { exact: true }).uncheck();
  await page.getByLabel("Habilitar cartão", { exact: true }).uncheck();
  await page.getByLabel("API Key", { exact: true }).fill("inchk_fixture_simulada");
  let response = page.waitForResponse((result) => result.url().endsWith(configurationUrl) && result.request().method() === "PATCH");
  await page.getByRole("button", { name: "Salvar InfinitePay" }).click();
  let saved = await response;
  expect(saved.status()).toBe(200);
  expect(saved.headers()["cache-control"]).toContain("no-store");
  const stored = (await saved.json()).data;
  expect(stored.has_api_key).toBe(true);
  expect(stored).not.toHaveProperty("api_key");
  expect(stored).not.toHaveProperty("api_key_ciphertext");
  await expect(page.getByLabel("API Key", { exact: true })).toHaveValue("");
  await expect(page.getByText("Configuração salva: Desativada")).toBeVisible();
  let methods = (await (await context.get(`${apiUrl}/metodos-pagamento`)).json()).data;
  expect(methods.every((item: { online_habilitado: boolean }) => !item.online_habilitado)).toBe(true);
  const configuration = await backend.db("infinitepay_configuracoes").where({ id: 1 }).first();
  const credential = await backend.db("infinitepay_credenciais").where({ id: configuration.credencial_id }).first();
  expect(credential.api_key_ciphertext).toMatch(/^v1:/);
  expect(credential.api_key_ciphertext).not.toContain("inchk_fixture_simulada");

  await page.getByLabel("Habilitar cartão", { exact: true }).check();
  await page.getByLabel("Ativar InfinitePay", { exact: true }).check();
  response = page.waitForResponse((result) => result.url().endsWith(configurationUrl) && result.request().method() === "PATCH");
  await page.getByRole("button", { name: "Salvar InfinitePay" }).click();
  saved = await response;
  expect(saved.status()).toBe(200);
  expect(saved.request().postDataJSON()).not.toHaveProperty("api_key");
  methods = (await (await context.get(`${apiUrl}/metodos-pagamento`)).json()).data;
  expect(methods.find((item: { codigo: string }) => item.codigo === "CREDITO").online_habilitado).toBe(true);
  expect(methods.find((item: { codigo: string }) => item.codigo === "PIX").online_habilitado).toBe(false);
  const credit = await checkout(page, "CREDITO");
  expect(backend.checkouts.get(credit.order.pagamento.order_nsu)!.payload.options.payment_methods_enabled).toEqual(["credit_card"]);
  expect((await backend.effects(credit.order.pedido_id)).impressoes).toBe(0);

  await page.goto(`${adminSite}/admin/metodos-pagamento`);
  await page.getByLabel("Habilitar Pix", { exact: true }).check();
  response = page.waitForResponse((result) => result.url().endsWith(configurationUrl) && result.request().method() === "PATCH");
  await page.getByRole("button", { name: "Salvar InfinitePay" }).click();
  expect((await response).status()).toBe(200);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: test.info().outputPath("infinitepay-painel-mobile.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const { order } = await checkout(page, "PIX");
  const payment = backend.checkouts.get(order.pagamento.order_nsu)!;
  expect(payment.payload.options.payment_methods_enabled).toEqual(["pix", "credit_card"]);
  await returnToStore(page, payment);
  await expect(page.getByRole("heading", { name: "Aguardando pagamento", exact: true })).toBeVisible();
  expect((await backend.effects(order.pedido_id)).impressoes).toBe(0);
  expect((await backend.effects(order.pedido_id)).notificacoes).toBe(0);

  payment.paid = true;
  const webhook = { order_nsu: payment.payload.order_nsu, transaction_nsu: payment.transaction_nsu, invoice_slug: payment.slug, event_type: "paid" };
  const delivered = await context.post(`${apiUrl}/pagamentos/webhook/infinitepay`, { data: webhook });
  expect(delivered.status()).toBe(200);
  expect((await backend.effects(order.pedido_id)).impressoes).toBe(0);
  await expect.poll(async () => {
    await backend.processSignals();
    return (await backend.effects(order.pedido_id)).infinitepay_confirmacoes;
  }, { timeout: 20_000, intervals: [500, 1000, 2000] }).toBe(1);
  await page.getByRole("button", { name: "Atualizar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Pagamento confirmado", exact: true })).toBeVisible();
  const status = await context.get(`${apiUrl}/pedidos/acompanhar/${order.codigo_acompanhamento}/pagamento`);
  expect(status.status()).toBe(200);
  expect((await status.json()).data.liberado_operacionalmente).toBe(true);
  const effects = await backend.effects(order.pedido_id);
  expect(effects.impressoes).toBe(1);
  expect(effects.infinitepay_transacoes).toBe(1);
  expect((await context.post(`${apiUrl}/pagamentos/webhook/infinitepay`, { data: webhook })).status()).toBe(200);
  await backend.processSignals();
  expect(await backend.effects(order.pedido_id)).toEqual(effects);
});

test("sessão no túnel permanece após reload e refresh com CSRF e Socket.IO", async ({ page }) => {
  test.skip(!new URL(process.env.NEXT_PUBLIC_SITE_URL ?? siteUrl).hostname.endsWith(".trycloudflare.com"), "Exige build com proxy de túnel e API isolada.");
  const apiOrigins: string[] = [];
  let socketConnections = 0;
  page.on("request", (request) => { const url = new URL(request.url()); if (url.pathname.startsWith("/api/v1/")) apiOrigins.push(url.origin); });
  page.on("websocket", (socket) => { socket.on("framereceived", ({ payload }) => { if (payload.toString().startsWith("40/admin,")) socketConnections++; }); });
  await page.goto("/admin/login");
  await page.getByLabel("E-mail").fill(backend.fixture.credentials.admin.email);
  await page.locator("#login-password").fill(backend.fixture.credentials.admin.password);
  await page.getByRole("button", { name: /entrar no painel/i }).click();
  await expect(page).toHaveURL(`${siteUrl}/admin`);
  await expect.poll(() => socketConnections).toBeGreaterThan(0);
  await page.reload();
  await expect(page).toHaveURL(`${siteUrl}/admin`);
  await expect.poll(() => socketConnections).toBeGreaterThan(1);
  const result = await page.evaluate(async () => {
    const denied = await fetch("/api/v1/auth/refresh", { method: "POST", credentials: "include" });
    const csrf = await fetch("/api/v1/auth/csrf", { credentials: "include", cache: "no-store" });
    const token = (await csrf.json()).data.csrf_token;
    const renewed = await fetch("/api/v1/auth/refresh", { method: "POST", credentials: "include", headers: { "x-csrf-token": token } });
    const me = await fetch("/api/v1/auth/me", { credentials: "include", cache: "no-store" });
    return { withoutCsrf: denied.status, csrf: csrf.status, refresh: renewed.status, me: me.status };
  });
  expect(result).toEqual({ withoutCsrf: 403, csrf: 200, refresh: 200, me: 200 });
  const cookies = await page.context().cookies(`${siteUrl}/api/v1/auth/refresh`);
  expect(cookies.find((cookie) => cookie.name === "ls_access")?.httpOnly).toBe(true);
  expect(cookies.find((cookie) => cookie.name === "ls_refresh")?.httpOnly).toBe(true);
  expect(apiOrigins.length).toBeGreaterThan(0);
  expect(apiOrigins.every((origin) => origin === siteUrl)).toBe(true);
  await page.reload();
  await expect(page).toHaveURL(`${siteUrl}/admin`);
});
