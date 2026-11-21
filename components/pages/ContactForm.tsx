"use client";

import { useState, useTransition, type FormEvent } from "react";
import { sendContactMessage, type ContactResult } from "@/app/actions/contact";
import { FloatingInput, FloatingTextarea } from "@/components/FloatingField";
import Icon from "@/components/Icon";

const empty = { name: "", email: "", phone: "", message: "", website: "" };

export default function ContactForm() {
  const [values, setValues] = useState(empty);
  const [result, setResult] = useState<ContactResult | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (key: keyof typeof empty) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await sendContactMessage(values).catch(
        (): ContactResult => ({ error: "Something went wrong. Please try again." }),
      );
      setResult(res);
      if ("ok" in res) setValues(empty);
    });
  };

  const fieldErrors = result && "error" in result ? result.fields ?? {} : {};

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto mt-8 max-w-[50rem] space-y-4">
      {result && "ok" in result && (
        <p role="status" className="flex items-center gap-2 text-[15px] font-medium text-[#28c100]">
          <Icon name="check_circle" size={20} fill />
          Thanks for contacting us. We&apos;ll get back to you as soon as possible.
        </p>
      )}
      {result && "error" in result && (
        <p role="alert" className="flex items-center gap-2 text-[15px] font-medium text-[#ff0000]">
          <Icon name="error" size={20} fill />
          {result.error}
        </p>
      )}

      {/* Honeypot: escondido de pessoas, visível para robôs */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={values.website}
        onChange={set("website")}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <FloatingInput id="contact-name" label="Name" autoComplete="name" value={values.name} onChange={set("name")} />
        <FloatingInput
          id="contact-email"
          label="Email *"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={set("email")}
          error={fieldErrors.email}
        />
      </div>
      <FloatingInput
        id="contact-phone"
        label="Phone number"
        type="tel"
        autoComplete="tel"
        value={values.phone}
        onChange={set("phone")}
      />
      <FloatingTextarea
        id="contact-message"
        label="Comment"
        required
        value={values.message}
        onChange={set("message")}
        error={fieldErrors.message}
      />

      <button
        type="submit"
        disabled={pending}
        className="flex h-[52px] w-full items-center justify-center rounded-md bg-red px-10 text-base font-semibold text-white transition-opacity disabled:opacity-60 md:w-auto"
      >
        {pending ? (
          <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-label="Sending" />
        ) : (
          "Send"
        )}
      </button>
    </form>
  );
}
