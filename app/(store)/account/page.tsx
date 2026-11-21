import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import SignOutButton from "@/components/auth/SignOutButton";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/product";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

const STATUS: Record<string, string> = {
  PENDING: "Awaiting payment",
  PAID: "Confirmed",
  FULFILLED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export default function AccountPage() {
  return (
    <section className="page-width py-8 md:py-12">
      <Suspense fallback={<div className="mx-auto h-80 max-w-[56rem] animate-pulse rounded-xl bg-bg-2" />}>
        <Account />
      </Suspense>
    </section>
  );
}

async function Account() {
  const session = await getSession();
  if (!session) redirect("/account/login");
  const { user } = session;

  // Pedidos feitos logado + pedidos antigos do mesmo email (só se o email for verificado, ex.: Google)
  const orders = await db.order.findMany({
    where: {
      status: { not: "PENDING" },
      OR: [{ userId: user.id }, ...(user.emailVerified ? [{ email: user.email.toLowerCase() }] : [])],
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-[56rem]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent text-lg font-bold text-white">
            {(user.name || user.email).charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="text-2xl leading-tight text-ink md:text-[28px]">Hi, {user.name.split(" ")[0]}</h1>
            <p className="text-sm text-ink/60">{user.email}</p>
          </div>
        </div>
        <SignOutButton />
      </div>

      <h2 className="mt-10 text-xl text-ink">Order history</h2>
      {orders.length === 0 ? (
        <div className="mt-4 rounded-xl border border-black/10 p-6 text-center">
          <p className="text-ink/70">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/"
            className="mt-4 inline-flex h-11 items-center rounded-md bg-accent px-6 font-semibold text-white"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="rounded-xl border border-black/10 p-4 md:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">Order #{String(o.number).padStart(4, "0")}</p>
                <span className="rounded-full bg-blush px-3 py-0.5 text-xs font-semibold text-accent">
                  {STATUS[o.status] ?? o.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink/60">
                {o.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ·{" "}
                {formatMoney(o.subtotal.toNumber())}
              </p>
              <ul className="mt-2 text-sm">
                {o.items.map((i) => (
                  <li key={i.id}>
                    {i.quantity}× {i.title}
                  </li>
                ))}
              </ul>
              <Link
                href="/pages/track-your-order"
                className="mt-3 inline-block text-sm font-semibold text-accent underline underline-offset-2"
              >
                Track this order
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
