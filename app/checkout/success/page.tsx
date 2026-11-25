import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import type Stripe from "stripe";
import ClearCart from "@/components/checkout/ClearCart";
import { CheckoutColumns, PolicyLinks } from "@/components/checkout/CheckoutShell";
import OrderAccountBox from "@/components/checkout/OrderAccountBox";
import OrderSummary from "@/components/checkout/OrderSummary";
import PixelPurchase from "@/components/checkout/PixelPurchase";
import { getSession } from "@/lib/auth";
import { linkOrderToUser } from "@/lib/orders";
import { markOrderPaid } from "@/lib/checkout";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export default function SuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  return (
    <Suspense
      fallback={
        <CheckoutColumns
          main={<div className="h-96 animate-pulse rounded-md bg-[#f5f5f5]" />}
          summary={<div className="h-48 animate-pulse rounded-md bg-[#ebebeb]" />}
        />
      }
    >
      <Confirmation searchParams={searchParams} />
    </Suspense>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return <div className="mt-5 rounded-[5px] border border-[#dedede] p-4 text-sm">{children}</div>;
}

function Problem({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto max-w-md px-5 py-16 text-center">
      <h1 className="text-2xl">{title}</h1>
      <p className="mt-3 text-[#707070]">{text}</p>
      <Link
        href="/checkout"
        className="mt-6 inline-flex h-12 items-center rounded-[5px] bg-accent px-8 font-semibold text-white"
      >
        Return to checkout
      </Link>
    </div>
  );
}

async function Confirmation({ searchParams }: Pick<PageProps<"/checkout/success">, "searchParams">) {
  // Sempre no request: consulta o Stripe e o banco (o SDK do Stripe usa Date.now internamente)
  await connection();
  const sp = await searchParams;
  const piId = typeof sp.payment_intent === "string" ? sp.payment_intent : null;
  const secret = typeof sp.payment_intent_client_secret === "string" ? sp.payment_intent_client_secret : null;
  if (!piId || !secret) return <Problem title="Order not found" text="We couldn't find this order." />;

  let pi: Stripe.PaymentIntent;
  try {
    pi = await stripe.paymentIntents.retrieve(piId, { expand: ["payment_method"] });
  } catch {
    return <Problem title="Order not found" text="We couldn't find this order." />;
  }
  // Só quem voltou do pagamento (tem o client secret) pode ver o pedido
  if (pi.client_secret !== secret) return <Problem title="Order not found" text="We couldn't find this order." />;

  if (pi.status === "requires_payment_method" || pi.status === "canceled") {
    return (
      <Problem
        title="Payment failed"
        text="Your payment was not completed. Please try again with another payment method."
      />
    );
  }

  const order =
    pi.status === "succeeded"
      ? await markOrderPaid(pi)
      : await db.order.findUnique({ where: { id: pi.metadata.orderId }, include: { items: true } });
  if (!order) return <Problem title="Order not found" text="We couldn't find this order." />;

  // Conta: logado com o mesmo email -> o pedido entra na conta (inclusive voltando do login/Google)
  const session = await getSession().catch(() => null);
  const orderEmail = order.email?.toLowerCase() ?? "";
  let accountMode: "linked" | "create" | "signin" | null = null;
  if (session) {
    if (session.user.email.toLowerCase() === orderEmail) {
      await linkOrderToUser(order, session.user.id);
      accountMode = "linked";
    }
  } else if (orderEmail) {
    const existing = await db.user.findUnique({ where: { email: orderEmail }, select: { id: true } });
    accountMode = existing ? "signin" : "create";
  }
  const returnUrl = `/checkout/success?payment_intent=${encodeURIComponent(piId)}&payment_intent_client_secret=${encodeURIComponent(secret)}`;

  const firstName = order.customerName?.split(" ")[0];
  const address = order.shippingAddress as Record<string, string | null> | null;
  const card =
    typeof pi.payment_method === "object" && pi.payment_method?.card ? pi.payment_method.card : null;
  const total = order.subtotal.toNumber();

  return (
    <>
      <ClearCart />
      {pi.status === "succeeded" && (
        <PixelPurchase
          orderId={order.id}
          value={total}
          contentIds={order.items.map((i) => i.productId ?? i.id)}
          numItems={order.items.reduce((n, i) => n + i.quantity, 0)}
        />
      )}
      <CheckoutColumns
        main={
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-accent text-accent">
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <p className="text-sm text-[#707070]">Confirmation #{String(order.number).padStart(4, "0")}</p>
                <h1 className="text-[22px] font-semibold tracking-normal">
                  Thank you{firstName ? `, ${firstName}` : ""}!
                </h1>
              </div>
            </div>

            <Box>
              <h2 className="text-base font-semibold tracking-normal">
                {pi.status === "succeeded" ? "Your order is confirmed" : "Your payment is processing"}
              </h2>
              <p className="mt-1 text-[#707070]">
                You&apos;ll receive a confirmation email with your order number shortly.
              </p>
            </Box>

            <Box>
              <h2 className="mb-3 text-base font-semibold tracking-normal">Order details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-medium">Contact information</h3>
                  <p className="text-[#707070]">{order.email}</p>
                </div>
                {card && (
                  <div>
                    <h3 className="font-medium">Payment method</h3>
                    <p className="text-[#707070] capitalize">
                      {card.brand} •••• {card.last4} — ${total.toFixed(2)}
                    </p>
                  </div>
                )}
                {address && (
                  <div>
                    <h3 className="font-medium">Shipping address</h3>
                    <p className="text-[#707070]">
                      {order.customerName}
                      <br />
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                      <br />
                      {address.city} {address.state} {address.postal_code}
                      <br />
                      {address.country}
                    </p>
                  </div>
                )}
                <div>
                  <h3 className="font-medium">Shipping method</h3>
                  <p className="text-[#707070]">Free shipping</p>
                </div>
              </div>
            </Box>

            {accountMode && (
              <OrderAccountBox
                mode={accountMode}
                email={orderEmail}
                paymentIntentId={piId}
                clientSecret={secret}
                returnUrl={returnUrl}
              />
            )}

            <div className="mt-6 flex flex-col-reverse items-center gap-4 md:flex-row md:justify-between">
              <p className="text-sm">
                Need help?{" "}
                <Link href="/pages/contact" className="text-[#1773b0] underline underline-offset-2">
                  Contact us
                </Link>
                {" · "}
                <Link href="/pages/track-your-order" className="text-[#1773b0] underline underline-offset-2">
                  Track your order
                </Link>
              </p>
              <Link
                href="/"
                className="flex h-14 w-full shrink-0 items-center justify-center whitespace-nowrap rounded-[5px] bg-accent px-8 font-semibold text-white md:w-auto"
              >
                Continue shopping
              </Link>
            </div>

            <div className="mt-8 md:hidden">
              <OrderSummary
                total={total}
                lines={order.items.map((i) => ({ key: i.id, title: i.title, image: i.image, price: i.unitPrice.toNumber(), qty: i.quantity }))}
              />
            </div>

            <PolicyLinks />
          </div>
        }
        summary={
          <OrderSummary
            total={total}
            lines={order.items.map((i) => ({ key: i.id, title: i.title, image: i.image, price: i.unitPrice.toNumber(), qty: i.quantity }))}
          />
        }
      />
    </>
  );
}
