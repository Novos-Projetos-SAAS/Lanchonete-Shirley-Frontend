import type { Money } from "@/types/domain";

export function moneyToCents(value: Money | number | null | undefined): number {
  if (value == null || value === "") return 0;
  const normalized = typeof value === "number" ? value.toFixed(2) : value;
  const [integer = "0", fraction = ""] = normalized.split(".");
  return Number(integer) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
}

export function centsToMoney(cents: number): Money {
  return (Math.max(0, Math.round(cents)) / 100).toFixed(2);
}

export function formatCurrency(value: Money | number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(moneyToCents(value) / 100);
}

