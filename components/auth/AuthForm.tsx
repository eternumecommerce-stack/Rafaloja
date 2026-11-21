"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FloatingInput } from "@/components/FloatingField";
import { authClient } from "@/lib/auth-client";

/**
 * Só aceita caminhos internos para o redirecionamento depois do login. O navegador trata "\" como
 * "/", então "/\evil.com" viraria "//evil.com": confere a origem do endereço já resolvido.
 */
function safeNext(next: string | null) {
  if (!next || !next.startsWith("/") || /[\\\u0000-\u001f]/.test(next)) return "/account";
  try {
    const base = "https://loja.invalid";
    const url = new URL(next, base);
    return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : "/account";
  } catch {
    return "/account";
  }
}


const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Incorrect email or password.",
  USER_ALREADY_EXISTS: "An account with this email already exists. Try signing in.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "An account with this email already exists. Try signing in.",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters.",
  INVALID_EMAIL: "Enter a valid email.",
};

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [name, setName] = useState("");
  // ?email= vem preenchido (ex.: depois da compra)
  const [email, setEmail] = useState(() => params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res =
        mode === "login"
          ? await authClient.signIn.email({ email: email.trim(), password })
          : await authClient.signUp.email({
              name: name.trim() || email.trim().split("@")[0],
              email: email.trim(),
              password,
            });
      if (res.error) {
        setError((res.error.code && MESSAGES[res.error.code]) || res.error.message || "Something went wrong.");
        return;
      }
      router.push(next);
      router.refresh();
    });
  };

  const otherHref = `${mode === "login" ? "/account/register" : "/account/login"}${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="space-y-3">
        {mode === "register" && (
          <FloatingInput id="auth-name" label="Name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        )}
        <FloatingInput
          id="auth-email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FloatingInput
          id="auth-password"
          label="Password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {mode === "register" && <p className="text-xs text-ink/60">At least 8 characters.</p>}

        {error && (
          <p role="alert" className="rounded-md bg-red/5 px-3 py-2.5 text-sm text-red">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex h-12 w-full items-center justify-center rounded-md bg-accent text-[15px] font-semibold text-white disabled:opacity-60"
        >
          {pending ? (
            <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : mode === "login" ? (
            "Sign in"
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/70">
        {mode === "login" ? "New customer? " : "Already have an account? "}
        <Link href={otherHref} className="font-semibold text-ink underline underline-offset-2">
          {mode === "login" ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </>
  );
}
