import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { readAdminSession } from "@/lib/admin-session";

const ADMIN_NAME = "Dono da loja";

/**
 * Garante que quem acessa uma página do /admin está logado no painel (login próprio em
 * /login/admin, credenciais no .env). Sem sessão válida -> tela de login do admin.
 */
export async function requireAdminPage() {
  // Sempre no request: lê cookie e confere a validade da sessão pela hora atual
  await connection();
  const session = await readAdminSession();
  if (!session) redirect("/login/admin");
  return { email: session.email, name: ADMIN_NAME };
}

/** Mesma checagem para Server Actions: lança erro em vez de redirecionar. */
export async function requireAdmin() {
  const session = await readAdminSession();
  if (!session) throw new Error("Unauthorized");
  return { email: session.email, name: ADMIN_NAME };
}
