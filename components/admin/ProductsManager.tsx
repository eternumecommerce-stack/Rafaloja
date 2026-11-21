"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteReview, setReviewPublished, updateOffer, updateProduct } from "@/app/admin/actions";
import Icon from "@/components/Icon";
import Media from "@/components/Media";
import { dateShort, usd } from "@/lib/admin-shared";
import { useToast } from "./Toast";
import { Card, EmptyState, PageHeader, btnGhost, btnPrimary, inputCls, labelCls } from "./ui";

export type AdminProduct = {
  id: string;
  handle: string;
  kind: string;
  title: string;
  subtitle: string | null;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  active: boolean;
};
export type AdminOffer = {
  id: string;
  productTitle: string;
  title: string;
  quantity: number;
  price: number;
  compareAtPrice: number | null;
  badge: string | null;
  gifts: string[];
  active: boolean;
};
export type AdminReview = {
  id: string;
  productTitle: string;
  author: string;
  body: string;
  rating: number;
  photoUrl: string | null;
  published: boolean;
  createdAt: string;
};

const KIND_LABEL: Record<string, string> = {
  MAIN: "Produto principal",
  BUNDLE: "Kit",
  ADDON: "Add-on (termômetro)",
  UPSELL: "Upsell do carrinho",
  WARRANTY: "Garantia",
};

type Res = { ok: true } | { error: string };

function useSave() {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const save = (fn: () => Promise<Res>, ok = "Salvo") =>
    start(async () => {
      const res = await fn().catch(() => ({ error: "Erro de conexão." }) as Res);
      if ("error" in res) toast.show("error", res.error);
      else {
        toast.show("success", ok);
        router.refresh();
      }
    });
  return { save, pending, toastNode: toast.node };
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-white/60">
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className={`relative h-6 w-11 rounded-full transition peer-focus-visible:ring-2 peer-focus-visible:ring-accent ${checked ? "bg-accent" : "bg-white/15"}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white transition ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} />
      </span>
      {label}
    </label>
  );
}

function ProductCard({ p }: { p: AdminProduct }) {
  const { save, pending, toastNode } = useSave();
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    title: p.title,
    subtitle: p.subtitle ?? "",
    price: String(p.price),
    compareAtPrice: p.compareAtPrice != null ? String(p.compareAtPrice) : "",
    image: p.image ?? "",
    active: p.active,
  });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Card className={`p-4 ${p.active ? "" : "opacity-60"}`}>
      <div className="flex items-center gap-4">
        <div className="w-16 shrink-0">
          <Media src={p.image} alt={p.title} rounded="rounded-xl" sizes="64px" fit={p.image?.endsWith(".svg") ? "contain" : "cover"} className="bg-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">{KIND_LABEL[p.kind] ?? p.kind}</p>
          <p className="truncate font-semibold">{p.title}</p>
          <p className="text-[13px] text-white/50">
            {usd(p.price)}
            {p.compareAtPrice != null && p.compareAtPrice > p.price && <s className="ml-2 text-white/30">{usd(p.compareAtPrice)}</s>}
            {!p.active && <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px]">Inativo</span>}
          </p>
        </div>
        <button onClick={() => setEdit((v) => !v)} className={btnGhost} aria-expanded={edit}>
          <Icon name={edit ? "expand_less" : "edit"} size={18} />
          <span className="hidden sm:inline">{edit ? "Fechar" : "Editar"}</span>
        </button>
      </div>

      {edit && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save(() => updateProduct(p.id, form), "Produto salvo");
          }}
          className="mt-4 grid gap-3 border-t border-white/5 pt-4 md:grid-cols-2"
        >
          <div>
            <label className={labelCls} htmlFor={`t-${p.id}`}>Nome</label>
            <input id={`t-${p.id}`} value={form.title} onChange={set("title")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor={`s-${p.id}`}>Subtítulo</label>
            <input id={`s-${p.id}`} value={form.subtitle} onChange={set("subtitle")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor={`p-${p.id}`}>Preço (USD)</label>
            <input id={`p-${p.id}`} inputMode="decimal" value={form.price} onChange={set("price")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor={`c-${p.id}`}>Preço riscado (opcional)</label>
            <input id={`c-${p.id}`} inputMode="decimal" value={form.compareAtPrice} onChange={set("compareAtPrice")} className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls} htmlFor={`i-${p.id}`}>Imagem (caminho em /public ou URL https)</label>
            <input id={`i-${p.id}`} value={form.image} onChange={set("image")} placeholder="/midia/..." className={inputCls} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
            <Switch checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label={form.active ? "Ativo na loja" : "Oculto da loja"} />
            <button disabled={pending} className={btnPrimary}>
              <Icon name="save" size={18} /> Salvar
            </button>
          </div>
        </form>
      )}
      {toastNode}
    </Card>
  );
}

function OfferCard({ o }: { o: AdminOffer }) {
  const { save, pending, toastNode } = useSave();
  const [form, setForm] = useState({
    title: o.title,
    price: String(o.price),
    compareAtPrice: o.compareAtPrice != null ? String(o.compareAtPrice) : "",
    badge: o.badge ?? "",
    gifts: o.gifts.join("\n"),
    active: o.active,
  });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Card className="p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(() => updateOffer(o.id, form), "Oferta salva");
        }}
        className="grid gap-3 md:grid-cols-2"
      >
        <div className="flex items-center justify-between md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
            {o.productTitle} · {o.quantity} unidade{o.quantity > 1 ? "s" : ""}
          </p>
          <Switch checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label={form.active ? "Ativa" : "Oculta"} />
        </div>
        <div>
          <label className={labelCls} htmlFor={`ot-${o.id}`}>Nome</label>
          <input id={`ot-${o.id}`} value={form.title} onChange={set("title")} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor={`ob-${o.id}`}>Selo (opcional)</label>
          <input id={`ob-${o.id}`} value={form.badge} onChange={set("badge")} placeholder="Buy 1, Get 1 50% OFF" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor={`op-${o.id}`}>Preço do pacote (USD)</label>
          <input id={`op-${o.id}`} inputMode="decimal" value={form.price} onChange={set("price")} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor={`oc-${o.id}`}>Preço riscado</label>
          <input id={`oc-${o.id}`} inputMode="decimal" value={form.compareAtPrice} onChange={set("compareAtPrice")} className={inputCls} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls} htmlFor={`og-${o.id}`}>Brindes (um por linha)</label>
          <textarea id={`og-${o.id}`} value={form.gifts} onChange={set("gifts")} rows={3} className={inputCls} />
        </div>
        <div className="md:col-span-2">
          <button disabled={pending} className={btnPrimary}>
            <Icon name="save" size={18} /> Salvar oferta
          </button>
        </div>
      </form>
      {toastNode}
    </Card>
  );
}

function ReviewRow({ r }: { r: AdminReview }) {
  const { save, pending, toastNode } = useSave();
  const [confirm, setConfirm] = useState(false);
  return (
    <li className={`flex gap-3 px-4 py-4 md:px-5 ${r.published ? "" : "opacity-55"}`}>
      <div className="w-14 shrink-0">
        <Media src={r.photoUrl} alt={r.author} rounded="rounded-lg" sizes="56px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {r.author} <span className="text-accent">{"★".repeat(r.rating)}</span>
        </p>
        <p className="line-clamp-2 text-[13px] text-white/55">{r.body}</p>
        <p className="mt-1 text-[11px] text-white/30">
          {r.productTitle} · {dateShort(r.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <Switch checked={r.published} onChange={(v) => save(() => setReviewPublished(r.id, v), v ? "Review publicada" : "Review oculta")} label={r.published ? "Publicada" : "Oculta"} />
        {confirm ? (
          <div className="flex gap-1">
            <button disabled={pending} onClick={() => save(() => deleteReview(r.id), "Review excluída")} className="rounded-lg bg-rose-500 px-2.5 py-1 text-[11px] font-semibold">
              Excluir
            </button>
            <button onClick={() => setConfirm(false)} className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px]">
              Cancelar
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)} className="flex items-center gap-1 text-[11px] text-white/35 hover:text-rose-300">
            <Icon name="delete" size={15} /> Excluir
          </button>
        )}
      </div>
      {toastNode}
    </li>
  );
}

export default function ProductsManager({ products, offers, reviews }: { products: AdminProduct[]; offers: AdminOffer[]; reviews: AdminReview[] }) {
  const [tab, setTab] = useState<"products" | "offers" | "reviews">("products");
  const tabs = [
    { id: "products" as const, label: `Produtos (${products.length})` },
    { id: "offers" as const, label: `Ofertas (${offers.length})` },
    { id: "reviews" as const, label: `Reviews (${reviews.length})` },
  ];

  return (
    <>
      <PageHeader
        title="Produtos"
        subtitle="Preços, ofertas e reviews. As mudanças aparecem na loja na hora."
        actions={
          <a href="/" target="_blank" rel="noopener noreferrer" className={btnGhost}>
            <Icon name="open_in_new" size={18} /> Ver na loja
          </a>
        }
      />
      <div role="tablist" className="mb-5 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-[12px] font-semibold ${tab === t.id ? "bg-accent text-white" : "bg-white/5 text-white/50 hover:text-white"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "products" && (
        <div className="space-y-3">
          {products.map((p) => (
            <ProductCard key={p.id + p.price + p.active + p.title} p={p} />
          ))}
        </div>
      )}
      {tab === "offers" && (
        <div className="grid gap-3 xl:grid-cols-2">
          {offers.length === 0 ? <EmptyState icon="sell" text="Nenhuma oferta." /> : offers.map((o) => <OfferCard key={o.id + o.price + o.active} o={o} />)}
        </div>
      )}
      {tab === "reviews" && (
        <Card className="overflow-hidden">
          {reviews.length === 0 ? (
            <EmptyState icon="reviews" text="Nenhuma review." />
          ) : (
            <ul className="divide-y divide-white/5">
              {reviews.map((r) => (
                <ReviewRow key={r.id + r.published} r={r} />
              ))}
            </ul>
          )}
        </Card>
      )}
    </>
  );
}
