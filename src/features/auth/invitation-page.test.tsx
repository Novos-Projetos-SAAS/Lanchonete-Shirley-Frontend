import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvitationPage } from "./invitation-page";

const service = vi.hoisted(() => ({
  validateInvitation: vi.fn(),
  acceptInvitation: vi.fn(),
}));

vi.mock("@/services/public-service", () => ({ publicService: service }));

describe("aceite público de convite", () => {
  beforeEach(() => {
    service.validateInvitation.mockReset();
    service.acceptInvitation.mockReset();
    window.history.replaceState(null, "", "/convite");
  });

  it("remove o token do fragmento antes de validar e não o persiste", async () => {
    const token = "a".repeat(43);
    service.validateInvitation.mockResolvedValue({
      valido: true,
      email_mascarado: "p***@example.invalid",
      nivel: "atendente",
      expira_em: "2026-10-30T12:00:00.000Z",
    });
    window.history.replaceState(null, "", `/convite#token=${token}`);
    render(<InvitationPage />);

    await waitFor(() => expect(service.validateInvitation).toHaveBeenCalledWith(token));
    expect(window.location.hash).toBe("");
    expect(window.location.href).not.toContain(token);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(await screen.findByRole("heading", { name: "Crie sua conta" })).toBeInTheDocument();
  });

  it("não consulta a API quando o fragmento é inválido", async () => {
    window.history.replaceState(null, "", "/convite#token=curto");
    render(<InvitationPage />);

    expect(await screen.findByRole("heading", { name: "Este convite não está disponível" })).toBeInTheDocument();
    expect(service.validateInvitation).not.toHaveBeenCalled();
    expect(window.location.hash).toBe("");
  });
});
