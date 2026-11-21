"use client";

import { useActionState } from "react";
import Icon from "@/components/Icon";
import { loginAdmin, type LoginState } from "./actions";

const input =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[15px] text-white placeholder:text-white/30 outline-none transition focus:border-accent/60 focus:ring-1 focus:ring-accent/40";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAdmin, null);
  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="admin-email" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
          Email
        </label>
        {/* key: o React limpa o formulário após a ação; mantém o email digitado */}
        <input key={state?.email ?? ""} id="admin-email" name="email" type="email" autoComplete="username" required defaultValue={state?.email ?? ""} className={input} />
      </div>
      <div>
        <label htmlFor="admin-password" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
          Senha
        </label>
        <input id="admin-password" name="password" type="password" autoComplete="current-password" required className={input} />
      </div>
      {state?.error && (
        <p role="alert" className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
          <Icon name="error" size={18} fill /> {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-[15px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <><Icon name="lock" size={18} /> Entrar no painel</>}
      </button>
    </form>
  );
}
