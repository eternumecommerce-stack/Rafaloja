import type { Metadata } from "next";
import { brand } from "@/lib/store";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Login do painel",
  robots: { index: false, follow: false },
};

/** Login exclusivo do dono da loja (credenciais no .env). Clientes usam /account/login. */
export default function AdminLoginPage() {
  return (
    <div className="admin-theme flex min-h-dvh items-center justify-center bg-[#0f0e12] px-4 py-10 text-white">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex size-[88px] items-center justify-center rounded-2xl bg-white/10 text-4xl font-bold" aria-hidden="true">
            {brand.name.charAt(0)}
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Painel da loja</h1>
          <p className="mt-1 text-[13px] text-white/45">Acesso restrito ao dono da loja</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#16141b] p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
