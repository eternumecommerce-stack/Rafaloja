import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { db } from "@/lib/db";

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  baseURL,
  database: prismaAdapter(db, { provider: "postgresql" }),
  // Só aceita requisições/redirecionamentos vindos do próprio site (CSRF e open redirect)
  trustedOrigins: [baseURL],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  // Só e-mail e senha: login com Google foi removido da loja
  // Limite de tentativas também em desenvolvimento (por padrão só vale em produção)
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      // Força bruta de senha / criação de contas em massa
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60 * 10, max: 5 },
      "/sign-in/social": { window: 60, max: 10 },
    },
  },
  advanced: {
    // Cookies com Secure quando o site roda em HTTPS (produção)
    useSecureCookies: baseURL.startsWith("https://"),
  },
  plugins: [nextCookies()],
});

/** Sessão atual (ou null). Lê cookies, então só pode rodar no request. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
