import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PermissionBoundary } from "./permission-boundary";
import { PermissionGate } from "./permission-gate";

let allowed = false;
vi.mock("@/features/auth/auth-provider", () => ({ useAuth: () => ({ hasPermission: () => allowed }) }));

describe("RBAC visual", () => {
  beforeEach(() => { allowed = false; });

  it("esconde ação sem permissão", () => {
    render(<PermissionGate permission="logs.listar"><button>Auditoria</button></PermissionGate>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("mostra ação autorizada", () => {
    allowed = true;
    render(<PermissionGate permission="logs.listar"><button>Auditoria</button></PermissionGate>);
    expect(screen.getByRole("button", { name: "Auditoria" })).toBeInTheDocument();
  });

  it("não monta a página nem dispara seus efeitos sem permissão", () => {
    const protectedRender = vi.fn();
    function ProtectedPage() { protectedRender(); return <div>Dados protegidos</div>; }
    render(<PermissionBoundary permission="usuarios.listar"><ProtectedPage /></PermissionBoundary>);
    expect(protectedRender).not.toHaveBeenCalled();
    expect(screen.queryByText("Dados protegidos")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Acesso não permitido" })).toBeInTheDocument();
  });

  it("monta a página autorizada", () => {
    allowed = true;
    const protectedRender = vi.fn();
    function ProtectedPage() { protectedRender(); return <div>Dados protegidos</div>; }
    render(<PermissionBoundary permission="usuarios.listar"><ProtectedPage /></PermissionBoundary>);
    expect(protectedRender).toHaveBeenCalledOnce();
    expect(screen.getByText("Dados protegidos")).toBeInTheDocument();
  });
});
