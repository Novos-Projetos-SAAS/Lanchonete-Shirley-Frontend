import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminShell } from "./admin-shell";

const authState = vi.hoisted(() => ({ permissions: [] as string[] }));
const routerState = vi.hoisted(() => ({ pathname: "/admin", replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => routerState.pathname,
  useRouter: () => ({ replace: routerState.replace }),
}));

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => ({
    user: { id: "1", nome: "Shirley", nivel: "admin", permissoes: authState.permissions },
    loading: false,
    hasPermission: (permission: string) => authState.permissions.includes("*") || authState.permissions.includes(permission),
  }),
}));

describe("AdminShell mobile", () => {
  beforeEach(() => { routerState.pathname = "/admin"; routerState.replace.mockReset(); });

  it.each([
    ["administrador", ["*"], ["Produtos", "Equipe", "Meu perfil"]],
    ["atendente", ["dashboard.visualizar", "pedidos.listar", "pedidos.criar", "notificacoes.receber"], ["Avisos", "Meu perfil"]],
    ["entregador", ["pedidos.listar"], ["Meu perfil"]],
  ])("abre Mais para %s sem redirecionar ao perfil", async (_role, permissions, expectedLinks) => {
    authState.permissions = permissions;
    render(<AdminShell><p>Conteúdo</p></AdminShell>);
    const more = screen.getByRole("button", { name: "Mais" });
    expect(more).not.toHaveAttribute("href");
    await userEvent.click(more);
    expect(screen.getByRole("heading", { name: "Mais opções" })).toBeInTheDocument();
    for (const label of expectedLinks) expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
  });
});
