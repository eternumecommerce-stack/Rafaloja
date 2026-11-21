"use server";

import { redirect } from "next/navigation";
import { checkAdminCredentials, clearAdminSession, createAdminSession } from "@/lib/admin-session";
import { rateLimit } from "@/lib/rate-limit";

export type LoginState = { error: string; email?: string } | null;

export async function loginAdmin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  // Força bruta: no máximo 5 tentativas a cada 15 minutos por IP
  if (!(await rateLimit("admin-login", 5, 15 * 60_000))) {
    return { error: "Muitas tentativas. Aguarde 15 minutos e tente de novo.", email: String(formData.get("email") ?? "").slice(0, 254) };
  }
  const email = String(formData.get("email") ?? "").slice(0, 254);
  const password = String(formData.get("password") ?? "").slice(0, 200);

  if (!checkAdminCredentials(email, password)) {
    // Pequena espera em toda falha: deixa tentativas automáticas ainda mais lentas
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Email ou senha incorretos.", email };
  }
  await createAdminSession();
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/login/admin");
}
