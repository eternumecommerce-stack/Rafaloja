"use client";

import { useState, useTransition, type FormEvent } from "react";
import { subscribeToNewsletter } from "@/app/actions/newsletter";
import Icon from "@/components/Icon";
import { newsletter } from "@/lib/store";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ ok: true } | { error: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await subscribeToNewsletter(email, "home").catch(() => ({
        error: "Something went wrong. Please try again.",
      }));
      setStatus(res);
      if ("ok" in res) setEmail("");
    });
  };

  const error = status && "error" in status ? status.error : null;

  return (
    <section className="bg-brand px-6 pb-[52px] pt-10 text-white/75 md:px-[90px]">
      <div className="mx-auto max-w-[1100px] text-center">
        <h2 className="text-[30px] leading-[1.3] text-white md:text-[40px]">{newsletter.title}</h2>
        <p className="mx-auto mt-5 max-w-[700px] text-[15px] leading-[1.8] md:text-base">{newsletter.text}</p>

        <form onSubmit={onSubmit} noValidate className="mx-auto mt-[30px] max-w-[360px]">
          <div className="relative shadow-[0_0_0_1px_rgba(255,255,255,0.55)] focus-within:shadow-[0_0_0_2px_rgba(255,255,255,0.85)]">
            <input
              id="newsletter-email"
              type="email"
              autoComplete="email"
              placeholder=" "
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setStatus(null);
              }}
              aria-invalid={!!error}
              className={`peer h-[47px] w-full bg-brand pb-1.5 pl-[15px] pr-[50px] pt-[18px] text-base tracking-[0.4px] text-white outline-none ${
                error ? "ring-2 ring-red" : ""
              }`}
            />
            <label
              htmlFor="newsletter-email"
              className="pointer-events-none absolute left-[15px] top-1/2 -translate-y-1/2 text-base tracking-[1px] text-white/75 transition-all peer-focus:top-[5px] peer-focus:translate-y-0 peer-focus:text-[11px] peer-[:not(:placeholder-shown)]:top-[5px] peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px]"
            >
              Email
            </label>
            <button
              type="submit"
              disabled={pending}
              aria-label="Subscribe"
              className="absolute right-0 top-0 flex h-[45px] w-12 items-center justify-center text-white disabled:opacity-50"
            >
              {pending ? (
                <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <svg viewBox="0 0 14 10" className="w-3.5" aria-hidden="true">
                  <path d="M8.5 1L13 5l-4.5 4M13 5H1" fill="none" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              )}
            </button>
          </div>
          {error && <p className="mt-2 text-left text-sm text-[#ffd2d2]">{error}</p>}
          {status && "ok" in status && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-white">
              <Icon name="check_circle" size={18} fill />
              Thanks for subscribing
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
