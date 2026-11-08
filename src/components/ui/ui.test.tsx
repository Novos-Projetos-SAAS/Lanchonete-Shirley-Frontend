import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CurrencyText, Field, FormErrorSummary, Input, OfflineState, Pagination, QuantityStepper, RowActions } from ".";

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
  it("resume os erros e direciona o foco ao primeiro campo inválido", async () => {
    render(<><Input id="preco" /><FormErrorSummary error={{ message: "Revise", fields: { preco_base: "Informe o preço" }, requestId: "req-1" }} fieldIds={{ preco_base: "preco" }} /></>);
    expect(screen.getByRole("alert")).toHaveTextContent("Referência do atendimento: req-1");
    await vi.waitFor(() => expect(document.getElementById("preco")).toHaveFocus());
  });
  it("pagina listagens em blocos acessíveis", () => {
    const change = vi.fn();
    render(<Pagination page={2} totalPages={4} totalItems={37} onPageChange={change} />);
    expect(screen.getByRole("navigation", { name: /paginação da listagem/i })).toHaveTextContent("Página 2 de 4 · 37 registros");
    fireEvent.click(screen.getByRole("button", { name: /anterior/i }));
    expect(change).toHaveBeenCalledWith(1);
  });
  it("não abre menu vazio e fecha ações com Escape", () => {
    const { rerender } = render(<RowActions>{false}</RowActions>);
    expect(screen.getByText("Sem ações")).toBeInTheDocument();
    rerender(<RowActions label="Ações do convite"><button type="button">Reemitir</button></RowActions>);
    const summary = screen.getByRole("button", { name: "Ações do convite" });
    fireEvent.click(summary);
    const details = summary.closest("details");
    expect(details).toHaveAttribute("open");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(details).not.toHaveAttribute("open");
  });
});

