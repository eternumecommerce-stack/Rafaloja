"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveAnnouncements } from "@/app/admin/actions";
import Icon from "@/components/Icon";
import { useToast } from "./Toast";
import { Card, PageHeader, btnGhost, btnPrimary, inputCls } from "./ui";

type Res = { ok: true } | { error: string };

export default function SettingsManager({
  announcements,
  adminEmail,
}: {
  announcements: { text: string; active: boolean }[];
  adminEmail: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [items, setItems] = useState(announcements);

  const run = (fn: () => Promise<Res>, ok: string, after?: () => void) =>
    start(async () => {
      const res = await fn().catch(() => ({ error: "Erro de conexão." }) as Res);
      if ("error" in res) toast.show("error", res.error);
      else {
        toast.show("success", ok);
        after?.();
        router.refresh();
      }
    });

  const update = (i: number, patch: Partial<{ text: string; active: boolean }>) => setItems((list) => list.map((a, j) => (j === i ? { ...a, ...patch } : a)));
  const move = (i: number, dir: -1 | 1) =>
    setItems((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const copy = [...list];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  return (
    <>
      <PageHeader title="Configurações" subtitle="Barra de anúncios da loja e acesso ao painel" />

      <Card className="p-5">
        <h2 className="text-base font-semibold">Barra de anúncios</h2>
        <p className="mb-4 text-[13px] text-white/45">As mensagens que giram na faixa vermelha do topo da loja.</p>
        <ul className="space-y-2">
          {items.map((a, i) => (
            <li key={i} className="flex items-center gap-2">
              <input value={a.text} onChange={(e) => update(i, { text: e.target.value })} maxLength={120} className={inputCls} aria-label={`Anúncio ${i + 1}`} />
              <button
                onClick={() => update(i, { active: !a.active })}
                className={`h-10 shrink-0 rounded-xl px-3 text-[12px] font-semibold ${a.active ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-white/40"}`}
              >
                {a.active ? "Ativo" : "Oculto"}
              </button>
              <button onClick={() => move(i, -1)} aria-label="Subir" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/50 hover:text-white">
                <Icon name="arrow_upward" size={18} />
              </button>
              <button onClick={() => setItems((l) => l.filter((_, j) => j !== i))} aria-label="Remover" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/50 hover:text-rose-300">
                <Icon name="delete" size={18} />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <button disabled={items.length >= 6} onClick={() => setItems((l) => [...l, { text: "", active: true }])} className={btnGhost}>
            <Icon name="add" size={18} /> Adicionar
          </button>
          <button disabled={pending} onClick={() => run(() => saveAnnouncements(items), "Anúncios salvos")} className={btnPrimary}>
            <Icon name="save" size={18} /> Salvar anúncios
          </button>
        </div>
      </Card>

      <Card className="mt-5 p-5">
        <h2 className="text-base font-semibold">Acesso ao painel</h2>
        <p className="mt-1 text-[13px] text-white/45">
          O painel tem um login próprio em <span className="font-mono text-white/70">/login/admin</span>, separado das contas de clientes.
          O email e a senha ficam no arquivo <span className="font-mono text-white/70">.env</span> do servidor
          (<span className="font-mono text-white/70">ADMIN_EMAIL</span> e <span className="font-mono text-white/70">ADMIN_PASSWORD</span>).
          Para trocar a senha, edite o .env e reinicie o servidor.
        </p>
        <p className="mt-3 flex items-center gap-2 text-sm">
          <Icon name="verified_user" size={18} className="text-accent" /> Conectado como <span className="font-semibold">{adminEmail}</span>
        </p>
      </Card>
      {toast.node}
    </>
  );
}
