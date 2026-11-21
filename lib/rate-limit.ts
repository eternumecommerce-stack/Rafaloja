import "server-only";
import { headers } from "next/headers";

/**
 * Limite de tentativas por IP (janela deslizante, em memória).
 * Protege formulários e ações contra abuso: força bruta, spam, enumeração de pedidos.
 *
 * Observação: a memória é por instância do servidor. Com várias instâncias (serverless),
 * troque o Map por um armazenamento compartilhado (ex.: Redis/Upstash) mantendo a mesma API.
 */
const hits = new Map<string, number[]>();
let lastSweep = Date.now();

export async function clientIp() {
  const h = await headers();
  // x-forwarded-for: "cliente, proxy1, proxy2" — o primeiro é o cliente
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** true = pode seguir; false = passou do limite. */
export async function rateLimit(bucket: string, limit: number, windowMs: number) {
  const now = Date.now();
  const key = `${bucket}:${await clientIp()}`;
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);

  // Limpeza periódica para o Map não crescer sem fim
  if (now - lastSweep > 10 * 60_000) {
    lastSweep = now;
    for (const [k, v] of hits) if (v.every((t) => now - t > 60 * 60_000)) hits.delete(k);
  }
  return true;
}

export const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";
