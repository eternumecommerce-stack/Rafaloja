"use client";

import { useState } from "react";
import { countries } from "@/lib/product";

const FLAGS: Record<string, string> = { Australia: "au", "New Zealand": "nz", "United States": "us" };

function Flag({ country }: { country: string }) {
  const code = FLAGS[country.split(" |")[0]];
  if (!code) return null;
  return (
    // Bandeira pequena de CDN público; não precisa passar pelo otimizador
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`https://flagcdn.com/w40/${code}.png`} alt="" width={18} height={12} className="h-3 w-[18px] rounded-[2px] object-cover" />
  );
}

export default function CountrySelector({
  dark = false,
  up = false,
}: {
  dark?: boolean;
  up?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("United States | USD $");

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-10 items-center gap-2 text-sm"
      >
        <Flag country={value} />
        {value}
        <svg viewBox="0 0 10 6" className={`size-2.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      {open && (
        <ul
          className={`absolute left-0 z-20 min-w-56 rounded-md border py-1 shadow-lg ${
            up ? "bottom-full mb-1" : "top-full mt-1"
          } ${dark ? "border-white/20 bg-[#1e1e1e] text-white" : "border-black/10 bg-white text-foreground"}`}
        >
          {countries.map((c) => (
            <li key={c}>
              <button
                onClick={() => {
                  setValue(c);
                  setOpen(false);
                }}
                className={`flex h-11 w-full items-center gap-2 px-4 text-left text-sm ${
                  c === value ? "font-semibold underline" : ""
                }`}
              >
                <Flag country={c} />
                {c}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
