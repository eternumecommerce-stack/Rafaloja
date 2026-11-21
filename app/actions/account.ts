"use server";

import { headers } from "next/headers";
import { auth, getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, TOO_MANY } from "@/lib/rate-limit";
import { linkOrderToUser, verifyBuyer, type SavedAddress } from "@/lib/orders";

/**
 * Cria a conta logo depois da compra, com o email do pedido, e já liga o pedido a ela.
 * Só funciona para quem acabou de pagar (validado pelo client secret do pagamento).
 */
export async function createAccountFromOrder(input: {
  paymentIntentId: string;
  clientSecret: string;
  password: string;
}): Promise<{ ok: true } | { error: string; exists?: boolean }> {
  if (!(await rateLimit("account-from-order", 5, 10 * 60_000))) return { error: TOO_MANY };
  const buyer = await verifyBuyer(String(input.paymentIntentId ?? ""), String(input.clientSecret ?? ""));
  if (!buyer?.order.email) return { error: "We couldn't verify this order." };
  const { order } = buyer;
  const email = order.email!;

  const password = String(input.password ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password.length > 128) return { error: "Password is too long." };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists. Sign in instead.", exists: true };

  try {
    // nextCookies() grava o cookie de sessão: a pessoa já sai logada
    const res = await auth.api.signUpEmail({
      body: { name: order.customerName || email.split("@")[0], email, password },
      headers: await headers(),
    });
    await linkOrderToUser(order, res.user.id);
    return { ok: true };
  } catch (e) {
    console.error("Account from order error", e);
    return { error: "We couldn't create your account. Please try again." };
  }
}

/** Nome, telefone e endereço salvos, para pré-preencher o checkout de quem está logado. */
export async function getCheckoutProfile(): Promise<{
  email: string;
  name: string;
  phone: string | null;
  address: SavedAddress | null;
} | null> {
  const session = await getSession().catch(() => null);
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, phone: true, address: true },
  });
  if (!user) return null;
  return { email: user.email, name: user.name, phone: user.phone, address: (user.address as SavedAddress | null) ?? null };
}
