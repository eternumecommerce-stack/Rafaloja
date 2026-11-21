import type { ReactNode } from "react";
import Icon from "@/components/Icon";
import { STATUS_ICON, STATUS_LABEL, STATUS_STYLE, type OrderStatusValue } from "@/lib/admin-shared";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-white/45">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/5 bg-[#16141b] ${className}`}>{children}</div>;
}

export function StatCard({ label, value, icon, hint }: { label: string; value: string; icon: string; hint?: string }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Icon name={icon} size={22} />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {hint && <p className="mt-1 text-[12px] text-white/35">{hint}</p>}
    </Card>
  );
}

export function StatusPill({ status }: { status: OrderStatusValue }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLE[status]}`}>
      <Icon name={STATUS_ICON[status]} size={14} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <Icon name={icon} size={40} className="text-white/15" />
      <p className="mt-3 text-sm text-white/35">{text}</p>
    </div>
  );
}

/** Classes comuns dos campos de formulário do painel */
export const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-accent/60 focus:ring-1 focus:ring-accent/40";

export const labelCls = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40";

export const btnPrimary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-50";

export const btnGhost =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-[13px] font-semibold text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50";
