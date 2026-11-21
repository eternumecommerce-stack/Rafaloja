// Rótulos e formatação do painel /admin (usado por servidor e cliente)

export const ORDER_STATUSES = ["PENDING", "PAID", "FULFILLED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatusValue, string> = {
  PENDING: "Aguardando pagamento",
  PAID: "Pagamento confirmado",
  FULFILLED: "Preparando o pedido",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

/** Classes da "pílula" de status (fundo + texto) no tema escuro do painel */
export const STATUS_STYLE: Record<OrderStatusValue, string> = {
  PENDING: "bg-white/10 text-white/50",
  PAID: "bg-emerald-500/15 text-emerald-400",
  FULFILLED: "bg-amber-500/15 text-amber-300",
  SHIPPED: "bg-sky-500/15 text-sky-300",
  DELIVERED: "bg-violet-500/15 text-violet-300",
  CANCELLED: "bg-rose-500/15 text-rose-300",
  REFUNDED: "bg-rose-500/15 text-rose-300",
};

export const STATUS_ICON: Record<OrderStatusValue, string> = {
  PENDING: "schedule",
  PAID: "paid",
  FULFILLED: "inventory_2",
  SHIPPED: "local_shipping",
  DELIVERED: "task_alt",
  CANCELLED: "block",
  REFUNDED: "currency_exchange",
};

/**
 * Etapas que o cliente acompanha no rastreio (Track Your Order), na ordem. O painel só move
 * o pedido entre elas; o rastreio lê o status do banco a cada consulta.
 */
export const TRACKER_STAGES: OrderStatusValue[] = ["PAID", "FULFILLED", "SHIPPED", "DELIVERED"];

/** Como cada etapa aparece para o cliente no rastreio (components/pages/TrackOrder.tsx) */
export const TRACKER_TEXT: Partial<Record<OrderStatusValue, string>> = {
  PAID: "Payment confirmed",
  FULFILLED: "Preparing your order",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
};

/** Status que contam como venda (entram no faturamento) */
export const SALE_STATUSES: OrderStatusValue[] = ["PAID", "FULFILLED", "SHIPPED", "DELIVERED"];

export const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export const dateTime = (iso: string | Date) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const dateShort = (iso: string | Date) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

export const orderNo = (n: number) => `#${String(n).padStart(4, "0")}`;
