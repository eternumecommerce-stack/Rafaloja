import Link from "next/link";
import PaymentIcons from "@/components/PaymentIcons";
import { brand, customerService, institutionalLinks, policyLinks } from "@/lib/store";

/** Título das colunas do rodapé: fonte com serifa (Lora), em maiúsculas */
const heading = "mb-3.5 font-serif text-[14px] font-bold uppercase leading-[1.3] tracking-[0.2px] text-ink";

function LinkList({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className={heading}>{title}</h2>
      <ul>
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="inline-block pb-[5px] text-[14px] font-medium leading-[1.5] text-body hover:text-ink hover:underline hover:underline-offset-4">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-line bg-white pt-12 md:pt-[60px]">
      <div className="page-width grid gap-10 pb-10 md:grid-cols-3 md:gap-8 md:pb-[50px]">
        <div>
          <h2 className={heading}>Customer service</h2>
          <div className="space-y-4 text-[15px] leading-[1.8] md:text-base">
            <p>
              <strong className="font-semibold text-ink">Customer service hours:</strong> {customerService.hours}
            </p>
            <p>
              <strong className="font-semibold text-ink">Address:</strong> {customerService.address}
            </p>
            <p>
              <strong className="font-semibold text-ink">Email:</strong>{" "}
              <a href={`mailto:${customerService.email}`} className="hover:text-ink hover:underline hover:underline-offset-4">
                {customerService.email}
              </a>
            </p>
          </div>
        </div>
        <LinkList title="Policies" links={policyLinks} />
        <LinkList title="Institutional" links={institutionalLinks} />
      </div>

      <div className="page-width flex flex-col items-center gap-4 pb-8 pt-[30px] md:flex-row md:justify-between">
        <PaymentIcons />
        <small className="text-[11px] tracking-[0.7px] text-body">© 2026, {brand.name}</small>
      </div>
    </footer>
  );
}
