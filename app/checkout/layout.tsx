import type { Metadata } from "next";
import { CheckoutHeader } from "@/components/checkout/CheckoutShell";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default function CheckoutLayout({ children }: LayoutProps<"/checkout">) {
  return (
    <>
      <CheckoutHeader />
      {children}
    </>
  );
}
