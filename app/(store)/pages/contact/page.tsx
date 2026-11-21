import type { Metadata } from "next";
import ContactForm from "@/components/pages/ContactForm";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <section className="animate-section page-width py-[27px] md:py-9">
      <h1 className="text-center text-[34px] leading-tight text-ink md:text-[40px]">Get in touch</h1>
      <ContactForm />
    </section>
  );
}
