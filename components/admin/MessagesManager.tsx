"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setMessageStatus } from "@/app/admin/actions";
import Icon from "@/components/Icon";
import { dateShort, dateTime } from "@/lib/admin-shared";
import { useToast } from "./Toast";
import { Card, EmptyState, PageHeader, btnGhost } from "./ui";

type MsgStatus = "NEW" | "READ" | "ANSWERED";
type Message = { id: string; name: string | null; email: string; phone: string | null; message: string; status: MsgStatus; createdAt: string };
type Subscriber = { id: string; email: string; source: string; createdAt: string };

const LABEL: Record<MsgStatus, string> = { NEW: "Nova", READ: "Lida", ANSWERED: "Respondida" };
const STYLE: Record<MsgStatus, string> = {
  NEW: "bg-accent/15 text-accent",
  READ: "bg-white/10 text-white/50",
  ANSWERED: "bg-emerald-500/15 text-emerald-300",
};

function downloadCsv(rows: Subscriber[]) {
  // Aspas duplas escapadas; prefixo "'" evita fórmulas se abrir no Excel
  const esc = (v: string) => `"${(/^[=+\-@]/.test(v) ? "'" + v : v).replace(/"/g, '""')}"`;
  const csv = ["email,origem,data", ...rows.map((r) => [r.email, r.source, r.createdAt].map(esc).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "newsletter.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function MessagesManager({ messages, subscribers }: { messages: Message[]; subscribers: Subscriber[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<"messages" | "newsletter">("messages");
  const [filter, setFilter] = useState<MsgStatus | "ALL">("NEW");
  const [openId, setOpenId] = useState<string | null>(null);

  const setStatus = (id: string, status: MsgStatus, msg: string) =>
    start(async () => {
      const res = await setMessageStatus(id, status).catch(() => ({ error: "Erro de conexão." }));
      if ("error" in res) toast.show("error", res.error);
      else {
        toast.show("success", msg);
        router.refresh();
      }
    });

  const counts = messages.reduce<Record<string, number>>((acc, m) => ((acc[m.status] = (acc[m.status] ?? 0) + 1), acc), {});
  const list = messages.filter((m) => filter === "ALL" || m.status === filter);

  return (
    <>
      <PageHeader title="Mensagens" subtitle={`${counts.NEW ?? 0} novas · ${subscribers.length} inscritos na newsletter`} />
      <div role="tablist" className="mb-5 flex gap-2">
        {(["messages", "newsletter"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-[12px] font-semibold ${tab === t ? "bg-accent text-white" : "bg-white/5 text-white/50 hover:text-white"}`}
          >
            {t === "messages" ? `Contato (${messages.length})` : `Newsletter (${subscribers.length})`}
          </button>
        ))}
      </div>

      {tab === "messages" ? (
        <>
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {(["NEW", "READ", "ANSWERED", "ALL"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[12px] font-semibold ${
                  filter === s ? "border-white bg-white text-black" : "border-white/5 bg-white/5 text-white/50 hover:text-white"
                }`}
              >
                {s === "ALL" ? `Todas (${messages.length})` : `${LABEL[s]}s (${counts[s] ?? 0})`}
              </button>
            ))}
          </div>
          <Card className="overflow-hidden">
            {list.length === 0 ? (
              <EmptyState icon="mark_email_read" text="Nenhuma mensagem aqui." />
            ) : (
              <ul className="divide-y divide-white/5">
                {list.map((m) => {
                  const open = openId === m.id;
                  return (
                    <li key={m.id}>
                      <button
                        onClick={() => {
                          setOpenId(open ? null : m.id);
                          if (!open && m.status === "NEW") setStatus(m.id, "READ", "Marcada como lida");
                        }}
                        className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-white/[0.03] md:px-5"
                        aria-expanded={open}
                      >
                        <span className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STYLE[m.status]}`}>{LABEL[m.status]}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{m.name || m.email}</p>
                          <p className={`text-[13px] text-white/50 ${open ? "" : "truncate"}`}>{m.message}</p>
                        </div>
                        <span className="shrink-0 text-[11px] text-white/35">{dateShort(m.createdAt)}</span>
                      </button>
                      {open && (
                        <div className="space-y-3 px-4 pb-4 md:px-5 md:pl-[5.5rem]">
                          <p className="whitespace-pre-wrap rounded-xl bg-white/[0.03] p-4 text-sm text-white/85">{m.message}</p>
                          <p className="text-[12px] text-white/45">
                            {m.email}
                            {m.phone ? ` · ${m.phone}` : ""} · {dateTime(m.createdAt)}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message")}`}
                              onClick={() => m.status !== "ANSWERED" && setStatus(m.id, "ANSWERED", "Marcada como respondida")}
                              className={btnGhost}
                            >
                              <Icon name="reply" size={18} /> Responder por email
                            </a>
                            {m.status !== "ANSWERED" && (
                              <button disabled={pending} onClick={() => setStatus(m.id, "ANSWERED", "Marcada como respondida")} className={btnGhost}>
                                <Icon name="done_all" size={18} /> Marcar respondida
                              </button>
                            )}
                            {m.status !== "NEW" && (
                              <button disabled={pending} onClick={() => setStatus(m.id, "NEW", "Marcada como nova")} className={btnGhost}>
                                <Icon name="mark_email_unread" size={18} /> Marcar como nova
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
            <p className="text-sm text-white/50">Emails de quem aceitou receber novidades (home e checkout).</p>
            <button disabled={subscribers.length === 0} onClick={() => downloadCsv(subscribers)} className={btnGhost}>
              <Icon name="download" size={18} /> Exportar CSV
            </button>
          </div>
          {subscribers.length === 0 ? (
            <EmptyState icon="mail" text="Ninguém inscrito ainda." />
          ) : (
            <ul className="divide-y divide-white/5">
              {subscribers.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="flex-1 truncate">{s.email}</span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/50">{s.source === "checkout" ? "Checkout" : "Home"}</span>
                  <span className="w-24 text-right text-[12px] text-white/35">{dateShort(s.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
      {toast.node}
    </>
  );
}
