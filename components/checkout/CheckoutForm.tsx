"use client";

import { readStoredTracking } from "@/lib/tracking";
import { useState, type FormEvent } from "react";
import {
  AddressElement,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
import { createPaymentIntent, type ShippingInput } from "@/app/checkout/actions";
import type { getCheckoutProfile } from "@/app/actions/account";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { formatMoney } from "@/lib/product";
import { PolicyLinks } from "./CheckoutShell";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COUNTRIES = ["US", "AU", "NZ"];

function SectionTitle({ children, aside }: { children: string; aside?: React.ReactNode }) {
  return (
    <div className="mb-2 mt-5 flex items-baseline justify-between first:mt-0">
      <h2 className="text-[17px] font-semibold tracking-normal">{children}</h2>
      {aside}
    </div>
  );
}

export type CheckoutProfile = Awaited<ReturnType<typeof getCheckoutProfile>>;

export default function CheckoutForm({
  items,
  total,
  profile,
}: {
  items: { id: string; qty: number }[];
  total: number;
  /** Dados salvos da conta (logado) para pré-preencher */
  profile: CheckoutProfile;
}) {
  const stripe = useStripe();
  const elements = useElements();
  // null = ainda não digitou: usa o email da conta logada, se houver
  const [typedEmail, setEmail] = useState<string | null>(null);
  const { data: session } = authClient.useSession();
  const email = typedEmail ?? profile?.email ?? session?.user.email ?? "";
  const [emailError, setEmailError] = useState<string | null>(null);
  const [newsletter, setNewsletter] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expressAvailable, setExpressAvailable] = useState(false);

  const returnUrl = () => `${window.location.origin}/checkout/success`;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(null);

    const cleanEmail = email.trim();
    if (!EMAIL_RE.test(cleanEmail)) {
      setEmailError("Enter a valid email");
      document.getElementById("email")?.focus();
      return;
    }

    setLoading(true);
    // Valida endereço + pagamento e mostra os erros inline nos campos do Stripe
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setLoading(false);
      return;
    }

    const addressElement = elements.getElement("address");
    const address = addressElement ? await addressElement.getValue() : null;
    if (!address?.complete) {
      setLoading(false);
      return;
    }
    const shipping: ShippingInput = {
      name: address.value.name,
      phone: address.value.phone,
      address: address.value.address,
    };

    const res = await createPaymentIntent({ items, email: cleanEmail, shipping, newsletter, tracking: readStoredTracking() }).catch(() => ({
      error: "Something went wrong. Please try again.",
    }));
    if ("error" in res) {
      setError(res.error);
      setLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret: res.clientSecret,
      confirmParams: {
        return_url: returnUrl(),
        // O Payment Element não pede endereço de cobrança: usa o de entrega (como "Same as shipping")
        payment_method_data: {
          billing_details: {
            name: shipping.name,
            email: cleanEmail,
            phone: shipping.phone ?? "",
            address: {
              ...shipping.address,
              line2: shipping.address.line2 ?? "",
              state: shipping.address.state ?? "",
            },
          },
        },
      },
    });
    // Só chega aqui se o pagamento falhar; no sucesso o Stripe redireciona
    setError(confirmError?.message ?? "Your payment could not be processed.");
    setLoading(false);
  };

  const onExpressConfirm = async (event: StripeExpressCheckoutElementConfirmEvent) => {
    if (!stripe || !elements) return;
    const ship = event.shippingAddress;
    if (!ship) {
      event.paymentFailed({ reason: "invalid_shipping_address" });
      return;
    }
    const res = await createPaymentIntent({
      items,
      tracking: readStoredTracking(),
      email: event.billingDetails?.email ?? "",
      shipping: { name: ship.name, phone: event.billingDetails?.phone ?? undefined, address: ship.address },
    }).catch(() => ({ error: "Something went wrong. Please try again." }));
    if ("error" in res) {
      event.paymentFailed({ reason: "fail" });
      setError(res.error);
      return;
    }
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret: res.clientSecret,
      confirmParams: { return_url: returnUrl() },
    });
    if (confirmError) setError(confirmError.message ?? "Your payment could not be processed.");
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      {/* Express checkout (Apple Pay / Google Pay / Link): só aparece se houver carteira disponível */}
      <div className={expressAvailable ? "mb-5" : "hidden"}>
        <p className="mb-3 text-center text-sm text-[#707070]">Express checkout</p>
        <ExpressCheckoutElement
          onReady={({ availablePaymentMethods }) => setExpressAvailable(!!availablePaymentMethods)}
          onConfirm={onExpressConfirm}
          options={{
            buttonHeight: 44,
            buttonType: { applePay: "buy", googlePay: "buy" },
            emailRequired: true,
            phoneNumberRequired: true,
            shippingAddressRequired: true,
            allowedShippingCountries: COUNTRIES,
            shippingRates: [{ id: "free-shipping", displayName: "Free shipping", amount: 0 }],
          }}
        />
        <div className="mt-6 flex items-center gap-3 text-xs text-[#707070]">
          <span className="h-px flex-1 bg-[#dedede]" />
          OR
          <span className="h-px flex-1 bg-[#dedede]" />
        </div>
      </div>

      <SectionTitle
        aside={
          session ? (
            <span className="text-xs text-[#707070]">Signed in</span>
          ) : (
            <Link href="/account/login?next=/checkout" className="text-sm text-[#1773b0] underline underline-offset-2">
              Log in
            </Link>
          )
        }
      >
        Contact
      </SectionTitle>
      <div className="relative">
        <input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder=" "
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(null);
          }}
          aria-invalid={!!emailError}
          className={`peer h-11 w-full rounded-[5px] border bg-white px-3 pt-3.5 text-base md:text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent ${
            emailError ? "border-red ring-1 ring-red" : "border-[#dedede]"
          }`}
        />
        <label
          htmlFor="email"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-[#707070] transition-all peer-focus:top-1 peer-focus:translate-y-0 peer-focus:text-[11px] peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] md:text-sm"
        >
          Email
        </label>
      </div>
      {emailError && <p className="mt-1.5 text-[13px] text-red">{emailError}</p>}
      <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-[13px]">
        <input
          type="checkbox"
          checked={newsletter}
          onChange={(e) => setNewsletter(e.target.checked)}
          className="size-4 rounded accent-[var(--accent)]"
        />
        Email me with news and offers
      </label>

      <SectionTitle>Delivery</SectionTitle>
      <AddressElement
        options={{
          mode: "shipping",
          allowedCountries: COUNTRIES,
          defaultValues: {
            firstName: profile?.address?.name?.split(" ")[0] ?? profile?.name.split(" ")[0] ?? null,
            lastName:
              (profile?.address?.name ?? profile?.name)?.split(" ").slice(1).join(" ") || null,
            phone: profile?.phone ?? null,
            address: profile?.address
              ? {
                  line1: profile.address.line1,
                  line2: profile.address.line2 ?? null,
                  city: profile.address.city,
                  state: profile.address.state ?? null,
                  postal_code: profile.address.postal_code,
                  country: profile.address.country,
                }
              : { country: "US" },
          },
          display: { name: "split" },
          fields: { phone: "always" },
          validation: { phone: { required: "always" } },
        }}
      />

      <SectionTitle>Shipping method</SectionTitle>
      <div className="flex items-center justify-between rounded-[5px] border border-accent bg-[#fff6ef] px-3.5 py-3 text-[13px]">
        <span>Free shipping</span>
        <span className="font-semibold">FREE</span>
      </div>

      <SectionTitle>Payment</SectionTitle>
      <p className="-mt-1.5 mb-2.5 text-[13px] text-[#707070]">All transactions are secure and encrypted.</p>
      <PaymentElement
        options={{
          layout: { type: "accordion", radios: "always", spacedAccordionItems: false, defaultCollapsed: false },
          fields: { billingDetails: { address: "never", email: "never" } },
        }}
      />

      {error && (
        <div role="alert" className="mt-5 rounded-[5px] border border-red/30 bg-red/5 px-4 py-3 text-sm text-red">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[5px] bg-accent text-[15px] font-semibold text-white transition-opacity disabled:opacity-60"
      >
        {loading ? (
          <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-label="Processing" />
        ) : (
          <>Pay now · {formatMoney(total)}</>
        )}
      </button>

      <PolicyLinks />
    </form>
  );
}
