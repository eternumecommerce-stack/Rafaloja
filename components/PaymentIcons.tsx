import { paymentMethods } from "@/lib/product";

export default function PaymentIcons({
  className = "",
  dark = false,
}: {
  className?: string;
  dark?: boolean;
}) {
  return (
    <ul className={`flex flex-wrap justify-center gap-1.5 ${className}`}>
      {paymentMethods.map((m) => (
        <li
          key={m}
          title={m}
          className={`flex h-6 min-w-[38px] items-center justify-center rounded px-1.5 text-[9px] font-semibold tracking-normal ${
            dark ? "bg-white/90 text-black/70" : "border border-black/10 bg-white text-black/60"
          }`}
        >
          {m}
        </li>
      ))}
    </ul>
  );
}
