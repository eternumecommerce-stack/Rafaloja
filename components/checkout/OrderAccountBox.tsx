"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createAccountFromOrder } from "@/app/actions/account";
import { FloatingInput } from "@/components/FloatingField";
import Icon from "@/components/Icon";

type Props = {
  /** linked: pedido já está na conta logada; create: sem conta ainda; signin: já existe conta com esse email */
  mode: "linked" | "create" | "signin";
  email: string;
  paymentIntentId: string;
  clientSecret: string;
  /** URL desta página: volta para cá depois do login (o pedido é ligado automaticamente) */
  returnUrl: string;
};

const box = "mt-5 rounded-[5px] border border-[#dedede] p-4 text-sm";

export default function OrderAccountBox({ mode, email, paymentIntentId, clientSecret, returnUrl}: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exists, setExists] = useState(false);
  const [pending, startTransition] = useTransition();

  if (mode === "linked") {
    return (
      <div className={`${box} flex items-start gap-3 bg-[#f3faf6]`}>
        <Icon name="verified_user" size={22} fill className="mt-0.5 text-[#108474]" />
        <div>
          <h2 className="text-base font-semibold tracking-normal">Saved to your account</h2>
          <p className="mt-1 text-[#707070]">You can follow this order anytime, no order number needed.</p>
          <Link href="/pages/track-your-order" className="mt-2 inline-block font-semibold text-[#1773b0] underline underline-offset-2">
            Track your orders
          </Link>
        </div>
      </div>
    );
  }

  const loginHref = `/account/login?email=${encodeURIComponent(email)}&next=${encodeURIComponent(returnUrl)}`;

  if (mode === "signin" || exists) {
    return (
      <div className={box}>
        <h2 className="text-base font-semibold tracking-normal">Sign in to track your order</h2>
        <p className="mt-1 text-[#707070]">
          You already have an account with <span className="font-medium text-black">{email}</span>. Sign in and this order
          will be added to it.
        </p>
        <Link
          href={loginHref}
          className="mt-4 flex h-12 w-full items-center justify-center rounded-[5px] bg-accent font-semibold text-white"
        >
          Sign in
        </Link>
        {error && <p className="mt-2 text-[13px] text-red">{error}</p>}
      </div>
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createAccountFromOrder({ paymentIntentId, clientSecret, password }).catch(() => ({
        error: "Something went wrong. Please try again.",
        exists: false,
      }));
      if ("error" in res) {
        setError(res.error);
        if (res.exists) setExists(true);
        return;
      }
      router.push("/pages/track-your-order");
      router.refresh();
    });
  };

  return (
    <div className={box}>
      <h2 className="text-base font-semibold tracking-normal">Create an account to track your order</h2>
      <p className="mt-1 text-[#707070]">
        Your email is already filled in, just choose a password. You&apos;ll be able to follow your orders and check out
        faster next time.
      </p>
      <form onSubmit={onSubmit} noValidate className="mt-4 space-y-3">
        <FloatingInput id="account-email" label="Email" type="email" value={email} readOnly className="[&_input]:bg-[#f7f7f7]" />
        <FloatingInput
          id="account-password"
          label="Create a password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error}
        />
        <p className="text-xs text-[#707070]">At least 8 characters.</p>
        <button
          type="submit"
          disabled={pending}
          className="flex h-12 w-full items-center justify-center rounded-[5px] bg-accent font-semibold text-white disabled:opacity-60"
        >
          {pending ? <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : "Create account"}
        </button>
      </form>
    </div>
  );
}
