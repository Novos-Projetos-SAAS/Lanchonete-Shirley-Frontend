"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, CircleOff, LoaderCircle, Minus, MoreHorizontal, Plus, RefreshCw, X } from "lucide-react";
import {
  forwardRef,
  cloneElement,
  Children,
  isValidElement,
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type FieldsetHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/money";
import type { Money, OrderStatus, PaymentStatus } from "@/types/domain";
import type { FormErrorFeedback } from "@/lib/api-errors";

const buttonVariants = cva("button", {
  variants: {
    variant: { primary: "button--primary", secondary: "button--secondary", ghost: "button--ghost", danger: "button--danger" },
    size: { sm: "button--sm", md: "button--md", lg: "button--lg" },
    full: { true: "button--full" },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, full, asChild, loading, disabled, children, ...props }, ref,
) {
  if (asChild) {
    return <Slot className={cn(buttonVariants({ variant, size, full }), className)} ref={ref} aria-disabled={disabled || loading || undefined}>{children}</Slot>;
  }
  return (
    <button className={cn(buttonVariants({ variant, size, full }), className)} ref={ref} disabled={disabled || loading} {...props}>
      {loading && <LoaderCircle className="spin" aria-hidden />}
      {children}
    </button>
  );
});

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { label: string; size?: "sm" | "md" }
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = "md", className, ...props }, ref,
) {
  return <button className={cn("icon-button", `icon-button--${size}`, className)} aria-label={label} title={label} ref={ref} {...props} />;
});

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input className={cn("input", className)} ref={ref} {...props} />;
});
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea className={cn("input textarea", className)} ref={ref} {...props} />;
});
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...props }, ref) {
  return <select className={cn("input select", className)} ref={ref} {...props} />;
});

interface FieldProps { label: string; htmlFor: string; hint?: string; error?: string; required?: boolean; children: ReactNode }
export function Field({ label, htmlFor, hint, error, required, children }: FieldProps) {
  const describedBy = [hint && `${htmlFor}-hint`, error && `${htmlFor}-error`].filter(Boolean).join(" ") || undefined;
  const decorateControl = (node: ReactNode): ReactNode => {
    if (!isValidElement<Record<string, unknown>>(node)) return node;
    if (node.props.id === htmlFor) {
      return cloneElement(node, {
        "aria-describedby": [node.props["aria-describedby"], describedBy].filter(Boolean).join(" ") || undefined,
        "aria-invalid": node.props["aria-invalid"] ?? (error ? true : undefined),
        "aria-required": node.props["aria-required"] ?? (required || undefined),
      });
    }
    if (node.props.children) {
      return cloneElement(node, {}, Children.map(node.props.children as ReactNode, decorateControl));
    }
    return node;
  };
  const control = decorateControl(children);
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}{required && <span aria-hidden> *</span>}</label>
      <div>{control}</div>
      {hint && <p className="field__hint" id={`${htmlFor}-hint`}>{hint}</p>}
      {error && <p className="field__error" id={`${htmlFor}-error`} role="alert">{error}</p>}
    </div>
  );
}

interface FormErrorSummaryProps {
  error: FormErrorFeedback | null;
  fieldIds?: Record<string, string>;
  focusFirstField?: boolean;
}

export function FormErrorSummary({ error, fieldIds = {}, focusFirstField = true }: FormErrorSummaryProps) {
  const summaryRef = useRef<HTMLDivElement>(null);
  const entries = Object.entries(error?.fields ?? {});
  const targetId = entries.length ? (fieldIds[entries[0][0]] ?? entries[0][0]) : undefined;
  useEffect(() => {
    if (!error) return;
    const target = targetId ? document.getElementById(targetId) : null;
    const focusTarget = focusFirstField && target instanceof HTMLElement ? target : summaryRef.current;
    window.requestAnimationFrame(() => {
      focusTarget?.focus({ preventScroll: true });
      focusTarget?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    });
  }, [error, targetId, focusFirstField]);
  if (!error) return null;
  return (
    <div className="form-error-summary" role="alert" aria-live="assertive" tabIndex={-1} ref={summaryRef}>
      <strong>{error.message}</strong>
      {entries.length > 0 && <ul>{entries.map(([field, message]) => {
        const id = fieldIds[field] ?? field;
        return <li key={field}><a href={`#${id}`} onClick={(event) => { event.preventDefault(); document.getElementById(id)?.focus(); }}>{message}</a></li>;
      })}</ul>}
      {error.requestId && <p className="form-error-summary__reference">Referência do atendimento: {error.requestId}</p>}
    </div>
  );
}

interface FieldGroupProps extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "title"> {
  title: ReactNode;
  description?: string;
}

export function FieldGroup({ title, description, className, children, ...props }: FieldGroupProps) {
  return (
    <fieldset className={cn("card field-group", className)} {...props}>
      <legend><span>{title}</span></legend>
      {description && <p className="field-group__description">{description}</p>}
      <div className="field-group__content">{children}</div>
    </fieldset>
  );
}

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Checkbox({ children, className, ...props }, ref) {
  return <label className={cn("choice", className)}><input type="checkbox" ref={ref} {...props} /><span className="choice__box"><Check aria-hidden /></span><span>{children}</span></label>;
});
export const Radio = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Radio({ children, className, ...props }, ref) {
  return <label className={cn("choice choice--radio", className)}><input type="radio" ref={ref} {...props} /><span className="choice__box" /><span>{children}</span></label>;
});

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("card", className)} {...props} />; }
export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) { return <span className={cn("badge", className)} {...props} />; }

const statusLabels: Record<OrderStatus | PaymentStatus, string> = {
  PENDENTE: "Pendente",
  EM_PREPARO: "Em preparo",
  PRONTO_PARA_RETIRADA: "Pronto para retirada",
  SAIU_PARA_ENTREGA: "Saiu para entrega",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
  PAGO: "Pago",
  ESTORNADO: "Estornado",
};
export function StatusBadge({ status }: { status: OrderStatus | PaymentStatus }) {
  return <Badge className={`status status--${status.toLowerCase()}`}>{status === "PENDENTE" && <span className="status__dot" aria-hidden />}{statusLabels[status]}</Badge>;
}

export function Skeleton({ className }: { className?: string }) { return <span className={cn("skeleton", className)} aria-hidden />; }

interface StateProps { title: string; description: string; action?: ReactNode; compact?: boolean }
export function EmptyState({ title, description, action, compact }: StateProps) {
  return <div className={cn("state", compact && "state--compact")}><CircleOff aria-hidden /><h2>{title}</h2><p>{description}</p>{action}</div>;
}
export function ErrorState({ title = "Algo não saiu como esperado", description, action, compact }: StateProps) {
  return <div className={cn("state state--error", compact && "state--compact")}><AlertTriangle aria-hidden /><h2>{title}</h2><p>{description}</p>{action}</div>;
}
export function OfflineState({ retry }: { retry?: () => void }) {
  return <ErrorState title="Você está sem conexão" description="O cardápio salvo pode ser consultado, mas pedidos não podem ser enviados offline." action={retry && <Button onClick={retry} variant="secondary"><RefreshCw aria-hidden /> Tentar novamente</Button>} />;
}

interface PageHeaderProps { eyebrow?: string; title: string; description?: string; actions?: ReactNode }
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return <header className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="page-header__actions">{actions}</div>}</header>;
}

interface DialogProps { open?: boolean; onOpenChange?: (open: boolean) => void; trigger?: ReactNode; title: string; description?: string; children: ReactNode; footer?: ReactNode; sheet?: boolean }
export function Dialog({ open, onOpenChange, trigger, title, description, children, footer, sheet }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay" />
        <DialogPrimitive.Content className={cn("dialog-content", sheet && "dialog-content--sheet")}>
          <div className="dialog-header"><div><DialogPrimitive.Title>{title}</DialogPrimitive.Title>{description && <DialogPrimitive.Description>{description}</DialogPrimitive.Description>}</div><DialogPrimitive.Close asChild><IconButton label="Fechar"><X aria-hidden /></IconButton></DialogPrimitive.Close></div>
          <div className="dialog-body">{children}</div>
          {footer && <div className="dialog-footer">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
export const Drawer = (props: DialogProps) => <Dialog {...props} sheet />;

interface ConfirmDialogProps { trigger: ReactNode; title: string; description: string; confirmLabel?: string; destructive?: boolean; onConfirm: () => void | Promise<void> }
export function ConfirmDialog({ trigger, title, description, confirmLabel = "Confirmar", destructive, onConfirm }: ConfirmDialogProps) {
  return <Dialog trigger={trigger} title={title} description={description} footer={<><DialogPrimitive.Close asChild><Button variant="ghost">Voltar</Button></DialogPrimitive.Close><DialogPrimitive.Close asChild><Button variant={destructive ? "danger" : "primary"} onClick={() => void onConfirm()}>{confirmLabel}</Button></DialogPrimitive.Close></>}>Revise a ação antes de confirmar.</Dialog>;
}

export function CurrencyText({ value, className }: { value: Money | number | null | undefined; className?: string }) {
  return <span className={cn("currency", className)}>{formatCurrency(value)}</span>;
}

interface QuantityStepperProps { value: number; onChange: (value: number) => void; min?: number; max?: number; label?: string }
export function QuantityStepper({ value, onChange, min = 1, max = 50, label = "Quantidade" }: QuantityStepperProps) {
  return <div className="stepper" aria-label={label}><IconButton label="Diminuir quantidade" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}><Minus aria-hidden /></IconButton><output aria-live="polite" aria-label={`${value} unidade${value === 1 ? "" : "s"}`}>{value}</output><IconButton label="Aumentar quantidade" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}><Plus aria-hidden /></IconButton></div>;
}

interface PriceLine { label: string; value: Money | number; emphasis?: boolean }
export function PriceBreakdown({ lines, note }: { lines: PriceLine[]; note?: string }) {
  return <div className="price-breakdown">{lines.map((line) => <div className={cn("price-line", line.emphasis && "price-line--total")} key={line.label}><span>{line.label}</span><CurrencyText value={line.value} /></div>)}{note && <p>{note}</p>}</div>;
}

interface DataListProps<T> { items: T[]; getKey: (item: T) => string; renderItem: (item: T) => ReactNode; empty?: ReactNode }
export function ResponsiveDataList<T>({ items, getKey, renderItem, empty }: DataListProps<T>) {
  if (!items.length) return <>{empty || null}</>;
  return <div className="data-list">{items.map((item) => <div className="data-list__item" key={getKey(item)}>{renderItem(item)}<ChevronRight className="data-list__chevron" aria-hidden /></div>)}</div>;
}

export interface ResponsiveTableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  items: T[];
  columns: ResponsiveTableColumn<T>[];
  getKey: (item: T) => string;
  caption: string;
}

export function ResponsiveTable<T>({ items, columns, getKey, caption }: ResponsiveTableProps<T>) {
  return <div className="responsive-table"><div className="responsive-table__desktop"><table><caption className="sr-only">{caption}</caption><thead><tr>{columns.map((column) => <th className={column.className} scope="col" key={column.key}>{column.header}</th>)}</tr></thead><tbody>{items.map((item) => <tr key={getKey(item)}>{columns.map((column) => <td className={column.className} key={column.key}>{column.render(item)}</td>)}</tr>)}</tbody></table></div><div className="responsive-table__mobile">{items.map((item) => <article className="data-card" key={getKey(item)}>{columns.filter((column) => !column.hideOnMobile).map((column) => <div className="data-card__field" key={column.key}><span>{column.header}</span><div>{column.render(item)}</div></div>)}</article>)}</div></div>;
}

interface PaginationProps { page: number; totalPages: number; totalItems: number; onPageChange: (page: number) => void; label?: string }
export function Pagination({ page, totalPages, totalItems, onPageChange, label = "Paginação da listagem" }: PaginationProps) {
  if (totalItems === 0) return null;
  const pages = Math.max(totalPages, 1);
  return <nav className="pagination" aria-label={label}><Button variant="ghost" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft aria-hidden /> Anterior</Button><span>Página {page} de {pages} · {totalItems} {totalItems === 1 ? "registro" : "registros"}</span><Button variant="ghost" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>Próxima <ChevronRight aria-hidden /></Button></nav>;
}

export function RowActions({ label = "Ações do registro", children }: { label?: string; children: ReactNode }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const actions = Children.toArray(children).filter(Boolean);
  useEffect(() => {
    function closeFromOutside(event: PointerEvent) {
      const details = detailsRef.current;
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) details.open = false;
    }
    function closeFromKeyboard(event: KeyboardEvent) {
      const details = detailsRef.current;
      if (event.key !== "Escape" || !details?.open) return;
      details.open = false;
      details.querySelector<HTMLElement>("summary")?.focus();
    }
    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromKeyboard);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromKeyboard);
    };
  }, []);
  if (!actions.length) return <span className="muted">Sem ações</span>;
  return <details className="row-actions" ref={detailsRef}><summary role="button" aria-label={label} title={label}><MoreHorizontal aria-hidden /></summary><div className="row-actions__menu">{actions}</div></details>;
}

