"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { getMyOrders, trackOrder, type TrackedOrder } from "@/app/actions/track";
import { authClient } from "@/lib/auth-client";
import { FloatingInput } from "@/components/FloatingField";
import Icon from "@/components/Icon";
import { formatMoney } from "@/lib/product";

declare global {
  interface Window {
    YQV5?: { trackSingle: (opts: Record<string, unknown>) => void };
  }
}

/** Carrega o widget do 17track (o mesmo da loja de referência) só quando alguém rastreia. */
let widgetPromise: Promise<void> | null = null;
function load17track() {
  if (window.YQV5) return Promise.resolve();
  widgetPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://www.17track.net/externalcall.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      widgetPromise = null;
      reject(new Error("17track failed to load"));
    };
    document.body.appendChild(s);
  });
  return widgetPromise;
}

const STATUS_TEXT: Record<TrackedOrder["status"], string> = {
  PENDING: "Awaiting payment",
  PAID: "Confirmed — we're getting your order ready",
  FULFILLED: "Packed and ready to ship",
  SHIPPED: "On its way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

function Timeline({ order }: { order: TrackedOrder }) {
  const reached = (statuses: TrackedOrder["status"][]) => statuses.includes(order.status);
  const steps = [
    { label: "Order placed", date: fmtDate(order.placedAt), done: true },
    { label: "Payment confirmed", done: reached(["PAID", "FULFILLED", "SHIPPED", "DELIVERED"]) },
    { label: "Preparing your order", done: reached(["FULFILLED", "SHIPPED", "DELIVERED"]) },
    { label: "Shipped", date: fmtDate(order.shippedAt), done: reached(["SHIPPED", "DELIVERED"]) },
    { label: "Delivered", date: fmtDate(order.deliveredAt), done: reached(["DELIVERED"]) },
  ];
  const current = steps.findIndex((s) => !s.done);

  return (
    <ol className="mt-5">
      {steps.map((s, i) => (
        <li key={s.label} className="relative flex gap-3 pb-5 last:pb-0">
          {i < steps.length - 1 && (
            <span
              aria-hidden="true"
              className={`absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-0.5 ${s.done && steps[i + 1].done ? "bg-accent" : "bg-black/10"}`}
            />
          )}
          <span
            className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
              s.done ? "border-accent bg-accent text-white" : i === current ? "border-accent bg-white" : "border-black/15 bg-white"
            }`}
          >
            {s.done && <Icon name="check" size={16} />}
            {!s.done && i === current && <span className="size-2 animate-pulse rounded-full bg-accent" />}
          </span>
          <div className="-mt-0.5">
            <p className={`text-[15px] ${s.done || i === current ? "font-semibold" : "text-ink/50"}`}>{s.label}</p>
            {s.date && <p className="text-[13px] text-ink/60">{s.date}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function OrderCard({ order, onTrackShipment }: { order: TrackedOrder; onTrackShipment: (num: string) => void }) {
  return (
  <section aria-live="polite" className="mt-7 rounded-xl border border-black/10 p-5 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg">Order #{order.number}</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            order.status === "CANCELLED" || order.status === "REFUNDED"
              ? "bg-red/10 text-red"
              : order.status === "DELIVERED"
                ? "bg-[#e6f6ec] text-[#108474]"
                : "bg-blush text-accent"
          }`}
        >
          {STATUS_TEXT[order.status]}
        </span>
      </div>

      {order.status === "CANCELLED" || order.status === "REFUNDED" ? (
        <p className="mt-4 text-sm text-ink/75">
          This order was {order.status === "CANCELLED" ? "cancelled" : "refunded"}. If you have questions,{" "}
          <Link href="/pages/contact" className="underline">
            contact us
          </Link>
          .
        </p>
      ) : (
        <Timeline order={order} />
      )}

      {order.trackingNumber && (
        <div className="mt-5 flex flex-col gap-3 rounded-lg bg-bg-2 p-4 text-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-ink/60">Tracking number{order.trackingCarrier ? ` · ${order.trackingCarrier}` : ""}</p>
            <p className="font-semibold tracking-wide">{order.trackingNumber}</p>
          </div>
          <button
            onClick={() => onTrackShipment(order.trackingNumber!)}
            className="h-10 rounded-md bg-ink px-4 font-semibold text-white"
          >
            Track shipment
          </button>
        </div>
      )}

      <dl className="mt-5 grid gap-3 border-t border-black/10 pt-4 text-sm md:grid-cols-2">
        {order.destination && (
          <div>
            <dt className="text-ink/60">Shipping to</dt>
            <dd className="font-medium">{order.destination}</dd>
          </div>
        )}
        <div>
          <dt className="text-ink/60">Total</dt>
          <dd className="font-medium">{formatMoney(order.total)}</dd>
        </div>
        <div className="md:col-span-2">
          <dt className="text-ink/60">Items</dt>
          <dd>
            <ul className="mt-1 space-y-0.5 font-medium">
              {order.items.map((i) => (
                <li key={i.title}>
                  {i.quantity}× {i.title}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
    </section>
  );
}

export default function TrackOrder() {
  const [tab, setTab] = useState<"order" | "tracking">("order");
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<{ order: TrackedOrder } | { error: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [widgetShown, setWidgetShown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Logado: mostra os pedidos da conta direto, sem número
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const userId = session?.user.id;
  const [myOrders, setMyOrders] = useState<{ userId: string; orders: TrackedOrder[] } | null>(null);
  const [showLookup, setShowLookup] = useState(false);
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getMyOrders()
      .then((orders) => !cancelled && setMyOrders({ userId, orders: orders ?? [] }))
      .catch(() => !cancelled && setMyOrders({ userId, orders: [] }));
    return () => {
      cancelled = true;
    };
  }, [userId]);
  const mine = userId && myOrders?.userId === userId ? myOrders.orders : null;

  const trackShipment = (num: string) => {
    setShowLookup(true);
    setTab("tracking");
    setTrackingNumber(num);
    runCarrierTracking(num);
  };

  const onOrderSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) {
      setResult({ error: "Enter your order number and the email used at checkout." });
      return;
    }
    startTransition(async () => {
      const res = await trackOrder(orderNumber, email).catch(() => ({
        error: "Something went wrong. Please try again.",
      }));
      setResult(res);
    });
  };

  const runCarrierTracking = async (num: string) => {
    const clean = num.trim();
    if (!clean) {
      setTrackingError("Enter your number.");
      return;
    }
    setTrackingError(null);
    setWidgetShown(true);
    try {
      await load17track();
      window.YQV5?.trackSingle({ YQ_ContainerId: "YQContainer", YQ_Height: 560, YQ_Fc: "0", YQ_Lang: "en", YQ_Num: clean });
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setTrackingError("The tracking service is unavailable right now. Please try again later.");
    }
  };

  const order = result && "order" in result ? result.order : null;
  const error = result && "error" in result ? result.error : null;

  const tabClass = (t: typeof tab) =>
    `h-11 flex-1 rounded-md text-sm font-semibold transition-colors ${tab === t ? "bg-white text-foreground shadow-sm" : "text-ink/60"}`;

  return (
    <div className="mx-auto mt-7 max-w-[40rem]">
      {userId ? (
        <section className="mb-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl text-ink">Your orders</h2>
            <span className="text-sm text-ink/60">{session?.user.email}</span>
          </div>
          {!mine ? (
            <div className="mt-4 h-40 animate-pulse rounded-xl bg-bg-2" />
          ) : mine.length === 0 ? (
            <div className="mt-4 rounded-xl border border-black/10 p-6 text-center text-sm">
              <p className="text-ink/70">No orders on this account yet.</p>
              <Link href="/" className="mt-3 inline-block font-semibold text-accent underline">
                Continue shopping
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {mine.map((o) => (
                <OrderCard key={o.number} order={o} onTrackShipment={trackShipment} />
              ))}
            </div>
          )}
          {!showLookup && (
            <button
              onClick={() => setShowLookup(true)}
              className="mt-5 text-sm font-semibold text-ink underline underline-offset-2"
            >
              Track a different order
            </button>
          )}
        </section>
      ) : (
        !sessionPending && (
          <p className="mb-5 rounded-lg bg-blush px-4 py-3 text-center text-sm">
            Have an account?{" "}
            <Link href="/account/login?next=/pages/track-your-order" className="font-semibold underline">
              Sign in
            </Link>{" "}
            to see all your orders without an order number.
          </p>
        )
      )}

      <div className={userId && !showLookup ? "hidden" : ""}>
      <div role="tablist" className="flex gap-1 rounded-lg bg-bg-2 p-1">
        <button role="tab" aria-selected={tab === "order"} onClick={() => setTab("order")} className={tabClass("order")}>
          Order number
        </button>
        <button role="tab" aria-selected={tab === "tracking"} onClick={() => setTab("tracking")} className={tabClass("tracking")}>
          Tracking number
        </button>
      </div>

      {tab === "order" ? (
        <>
          <form onSubmit={onOrderSubmit} noValidate className="mt-5 space-y-4">
            <FloatingInput
              id="track-order"
              label="Order number (e.g. #0002)"
              inputMode="numeric"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
            />
            <FloatingInput
              id="track-email"
              label="Email used at checkout"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && (
              <p role="alert" className="text-sm text-red">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="flex h-[52px] w-full items-center justify-center rounded-md bg-accent text-base font-semibold tracking-[0.08em] text-white disabled:opacity-60"
            >
              {pending ? <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : "TRACK"}
            </button>
          </form>

          {order && <OrderCard order={order} onTrackShipment={trackShipment} />}
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runCarrierTracking(trackingNumber);
          }}
          noValidate
          className="mt-5 space-y-4"
        >
          <FloatingInput
            id="YQNum"
            label="Tracking number"
            maxLength={50}
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            error={trackingError}
          />
          <button
            type="submit"
            className="flex h-[52px] w-full items-center justify-center rounded-md bg-accent text-base font-semibold tracking-[0.08em] text-white"
          >
            TRACK
          </button>
        </form>
      )}

      </div>

      {/* Resultado do 17track (fica montado para o widget não perder o container) */}
      <div ref={containerRef} className={tab === "tracking" && widgetShown ? "mt-6" : "hidden"}>
        <div id="YQContainer" className="min-h-[200px]" />
      </div>
    </div>
  );
}
