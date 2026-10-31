import { describe, expect, it } from "vitest";
import type { ReportMetadata } from "@/types/domain";
import { displayReportValue, validateReportFilters } from "./reports-page";

const metadata: ReportMetadata = {
  codigo: "faturamento_periodo", nome: "Faturamento", descricao: "Teste", grupo: "GERENCIAL",
  ordem_exibicao: 1, limite_linhas: 2000, filtros_padrao: {},
  filtros_config: [
    { chave: "data_inicio", rotulo: "Data inicial", tipo: "date", obrigatorio: true },
    { chave: "data_fim", rotulo: "Data final", tipo: "date", obrigatorio: true },
    { chave: "status", rotulo: "Status", tipo: "select", opcoes: "status_pedido" },
  ],
  colunas_config: [{ chave: "faturamento", rotulo: "Faturamento", tipo: "money" }],
};

describe("relatórios dinâmicos", () => {
  it("valida filtros obrigatórios e a ordem do período", () => {
    expect(validateReportFilters(metadata, {})).toBe(false);
    expect(validateReportFilters(metadata, { data_inicio: "2026-10-30", data_fim: "2026-10-01" })).toBe(false);
    expect(validateReportFilters(metadata, { data_inicio: "2026-10-01", data_fim: "2026-10-30", status: "ENTREGUE" })).toBe(true);
  });

  it("formata decimais oficiais sem recalcular totais", () => {
    expect(displayReportValue("1234.56", "money")).toContain("1.234,56");
    expect(displayReportValue("37.5", "percent")).toBe("37,5%");
    expect(displayReportValue(true, "boolean")).toBe("Sim");
  });
});

