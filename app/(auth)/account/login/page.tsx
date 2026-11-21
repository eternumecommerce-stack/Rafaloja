import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-center text-2xl text-ink">Sign in</h1>
      <p className="mb-6 mt-1 text-center text-sm text-ink/60">Sign in with your email and password</p>
      {/* useSearchParams (destino depois do login) precisa de Suspense */}
      <Suspense fallback={<div className="h-72" />}>
        <AuthForm mode="login" />
      </Suspense>
    </>
  );
}
