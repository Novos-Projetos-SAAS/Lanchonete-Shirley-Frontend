import { Check, Clock3, PackageCheck, Sandwich, Truck } from "lucide-react";
import type { DeliveryType, OrderStatus } from "@/types/domain";

export function StatusTimeline({ status, deliveryType = "ENTREGA" }: { status: OrderStatus; deliveryType?: DeliveryType }) {
  const steps: Array<{ status: OrderStatus; label: string; icon: typeof Check }> = [
    { status: "PENDENTE", label: "Recebido", icon: Clock3 },
    { status: "EM_PREPARO", label: "Na chapa", icon: Sandwich },
    deliveryType === "ENTREGA" ? { status: "SAIU_PARA_ENTREGA", label: "A caminho", icon: Truck } : { status: "PRONTO_PARA_RETIRADA", label: "Pronto para retirar", icon: PackageCheck },
    { status: "ENTREGUE", label: deliveryType === "ENTREGA" ? "Entregue" : "Retirado", icon: Check },
  ];
  const index = steps.findIndex((step) => step.status === status);
  if (status === "CANCELADO") return <div className="cancelled-status" role="status">Este pedido foi cancelado. Fale com a loja se precisar de ajuda.</div>;
  return <ol className="status-timeline">{steps.map((step, stepIndex) => { const Icon = step.icon; const done = stepIndex <= index; return <li className={done ? "is-done" : ""} key={step.status} aria-current={step.status === status ? "step" : undefined}><span><Icon aria-hidden /></span><strong>{step.label}</strong></li>; })}</ol>;
}

