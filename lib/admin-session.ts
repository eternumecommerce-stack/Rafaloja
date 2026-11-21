import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * Sessão do painel /admin, separada das contas de clientes.
 * Credenciais no .env (ADMIN_EMAIL / ADMIN_PASSWORD). O cookie guarda email + validade,
 * assinado com HMAC (ADMIN_SESSION_SECRET): não dá para forjar nem alterar.
 */
const COOKIE = "gd_admin";
const MAX_AGE = 8 * 60 * 60; // 8 horas

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("ADMIN_SESSION_SECRET ausente ou curto no .env");
  return s;
}

const sign = (data: string) => crypto.createHmac("sha256", secret()).update(data).digest("base64url");

/** Comparação em tempo constante (não vaza, pelo tempo de resposta, quantos caracteres acertou) */
function safeEqual(a: string, b: string) {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function adminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
}

export function checkAdminCredentials(email: string, password: string) {
  const expectedEmail = adminEmail();
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!expectedEmail || expectedPassword.length < 12) {
    // Painel desativado sem credenciais fortes (o aviso fica só no servidor, não na tela)
    console.warn("[admin] Login desativado: defina ADMIN_EMAIL e ADMIN_PASSWORD (12+ caracteres) no .env");
    return false;
  }
  const emailOk = safeEqual(email.trim().toLowerCase(), expectedEmail);
  const passwordOk = safeEqual(password, expectedPassword);
  return emailOk && passwordOk;
}

export async function createAdminSession() {
  const payload = Buffer.from(JSON.stringify({ e: adminEmail(), exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true, // JavaScript da página não lê o cookie
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // não vai junto em requisições vindas de outros sites
    path: "/admin", // só é enviado para o painel
    maxAge: MAX_AGE,
  });
}

/** Sessão válida -> { email }; senão null. */
export async function readAdminSession() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { e: string; exp: number };
    // Expirou, ou o ADMIN_EMAIL mudou no .env -> sessão inválida
    if (typeof data.exp !== "number" || data.exp < Date.now() || data.e !== adminEmail()) return null;
    return { email: data.e };
  } catch {
    return null;
  }
}

export async function clearAdminSession() {
  (await cookies()).set(COOKIE, "", { path: "/admin", maxAge: 0 });
}
