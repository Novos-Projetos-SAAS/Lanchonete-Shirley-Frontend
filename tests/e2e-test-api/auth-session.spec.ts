import { expect, test } from "@playwright/test";

test("login, sessão HttpOnly e logout com fixture efêmera no backend TEST", async ({ page, context }) => {
  const email = process.env.REAL_TEST_ADMIN_EMAIL;
  const password = process.env.REAL_TEST_ADMIN_PASSWORD;
  if (!email?.endsWith("@example.invalid") || !password) throw new Error("Credencial efêmera TEST ausente.");

  await page.goto("/admin/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: /entrar no painel/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: /visão geral/i })).toBeVisible();

  const cookies = await context.cookies("http://localhost:3334");
  expect(cookies.some((cookie) => cookie.httpOnly)).toBe(true);
  expect(await page.evaluate(() => Object.keys(localStorage).some((key) => /token|jwt/i.test(key)))).toBe(false);

  await page.goto("/admin/perfil");
  await page.getByRole("button", { name: /sair deste aparelho/i }).click();
  await page.getByRole("button", { name: /^sair$/i }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
});
