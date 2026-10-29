import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("frontend real consome apenas GETs públicos do backend de desenvolvimento", async ({ page }) => {
  const apiRequests: Array<{ method: string; pathname: string }> = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin === "http://localhost:3333") apiRequests.push({ method: request.method(), pathname: url.pathname });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /seu lanche/i })).toBeVisible();
  await expect(page.getByText(/aberta agora|fechada agora/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /o que vai sair da chapa/i })).toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(14);

  expect(apiRequests.some((item) => item.pathname === "/api/v1/loja/status")).toBe(true);
  expect(apiRequests.some((item) => item.pathname === "/api/v1/cardapio")).toBe(true);
  expect(apiRequests.every((item) => item.method === "GET" || item.method === "OPTIONS")).toBe(true);

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations.filter((violation) => ["serious", "critical"].includes(violation.impact || ""))).toEqual([]);
  await page.screenshot({ path: "docs/screenshots/demo-cardapio-real-390.png", fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: "docs/screenshots/demo-cardapio-real-1280.png", fullPage: true });
});

test("cliente monta um X-Salada real e para no checkout com a loja fechada", async ({ page }) => {
  const apiRequests: Array<{ method: string; pathname: string }> = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin === "http://localhost:3333") apiRequests.push({ method: request.method(), pathname: url.pathname });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByPlaceholder(/buscar lanche/i).fill("X-Salada");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.getByRole("link", { name: "Ver X-Salada" }).click();

  await expect(page.getByRole("heading", { name: "X-Salada" })).toBeVisible();
  await page.getByRole("radio", { name: /franc/i }).check();
  const bacon = page.locator(".additional-row").filter({ hasText: "Bacon" });
  await bacon.getByRole("button", { name: "Aumentar quantidade" }).click();
  await page.locator(".add-bar").getByRole("button", { name: "Aumentar quantidade" }).click();
  await page.screenshot({ path: "docs/screenshots/demo-produto-real-390.png", fullPage: true });

  await page.getByRole("button", { name: /adicionar/i }).click();
  await expect(page.getByRole("heading", { name: "Carrinho" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "X-Salada" })).toBeVisible();
  await expect(page.getByText(/1× Bacon/i)).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/demo-carrinho-real-390.png", fullPage: true });

  await page.getByRole("link", { name: /ir para finalizar/i }).click();
  await expect(page.getByRole("heading", { name: /a loja não está aceitando pedidos/i })).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/demo-checkout-fechado-real-390.png", fullPage: true });

  expect(apiRequests.some((item) => item.pathname === "/api/v1/cardapio")).toBe(true);
  expect(apiRequests.some((item) => item.pathname.startsWith("/api/v1/cardapio/produtos/"))).toBe(true);
  expect(apiRequests.every((item) => item.method === "GET" || item.method === "OPTIONS")).toBe(true);
});
