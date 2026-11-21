import type { Metadata } from "next";
import TrackOrder from "@/components/pages/TrackOrder";

export const metadata: Metadata = { title: "Track your order" };

export default function TrackYourOrderPage() {
  return (
    <section className="animate-section page-width py-7 md:py-9">
      <div className="mx-auto max-w-[56rem] text-center">
        <h1 className="text-[34px] leading-tight text-ink md:text-[40px]">Track your order</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink/75">
          Welcome to our tracking page! Here you can easily track the status of your order by simply entering the
          tracking number we provided in your confirmation email. Stay up-to-date with the latest information on your
          delivery and ensure a hassle-free experience. Thank you for choosing our services! If you have any questions
          don&apos;t hesitate to contact us.
        </p>
      </div>
      <TrackOrder />
    </section>
  );
}
