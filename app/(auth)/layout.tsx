import Link from "next/link";
import Logo from "@/components/Logo";

/** Login/cadastro em página limpa, como o login de clientes da loja de referência. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg-2 px-4 py-8 md:py-14">
      <main className="mx-auto w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] md:p-8">
        <div className="mx-auto mb-5 w-fit">
          <Logo className="h-20" />
        </div>
        {children}
      </main>
      <nav className="mt-6 flex justify-center gap-5 text-xs text-ink/60">
        <Link href="/" className="hover:underline">
          Back to store
        </Link>
        <a href="#" className="hover:underline">
          Privacy policy
        </a>
      </nav>
    </div>
  );
}
