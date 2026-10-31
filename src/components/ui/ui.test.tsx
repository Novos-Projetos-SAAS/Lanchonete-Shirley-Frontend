import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CurrencyText, Field, Input, OfflineState, Pagination, QuantityStepper } from ".";

describe("componentes críticos", () => {
  it("formata dinheiro brasileiro a partir de string decimal", () => { render(<CurrencyText value="28.50" />); expect(screen.getByText(/28,50/)).toBeInTheDocument(); });
  it("respeita mínimo e máximo do seletor de quantidade", () => { const change = vi.fn(); const { rerender } = render(<QuantityStepper value={1} min={1} max={2} onChange={change} />); expect(screen.getByRole("button", { name: /diminuir/i })).toBeDisabled(); fireEvent.click(screen.getByRole("button", { name: /aumentar/i })); expect(change).toHaveBeenCalledWith(2); rerender(<QuantityStepper value={2} min={1} max={2} onChange={change} />); expect(screen.getByRole("button", { name: /aumentar/i })).toBeDisabled(); });
  it("explica que pedidos não são enviados offline", () => { render(<OfflineState />); expect(screen.getByText(/pedidos não podem ser enviados offline/i)).toBeInTheDocument(); });
  it("associa dica, erro e obrigatoriedade ao controle do campo", () => {
    render(<Field label="Nome" htmlFor="name" required hint="Como está no pedido" error="Informe o nome"><Input id="name" /></Field>);
    const input = screen.getByLabelText("Nome *");
    expect(input).toHaveAttribute("aria-describedby", "name-hint name-error");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-required", "true");
  });
  it("pagina listagens em blocos acessíveis", () => {
    const change = vi.fn();
    render(<Pagination page={2} totalPages={4} totalItems={37} onPageChange={change} />);
    expect(screen.getByRole("navigation", { name: /paginação da listagem/i })).toHaveTextContent("Página 2 de 4 · 37 registros");
    fireEvent.click(screen.getByRole("button", { name: /anterior/i }));
    expect(change).toHaveBeenCalledWith(1);
  });
});

