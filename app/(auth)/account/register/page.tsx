import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-center text-2xl text-ink">Create account</h1>
      <p className="mb-6 mt-1 text-center text-sm text-ink/60">Sign up to track orders and check out faster</p>
      {/* useSearchParams (destino depois do login) precisa de Suspense */}
      <Suspense fallback={<div className="h-72" />}>
        <AuthForm mode="register" />
      </Suspense>
    </>
  );
}
