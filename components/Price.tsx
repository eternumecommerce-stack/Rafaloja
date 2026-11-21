import { formatMoney } from "@/lib/product";

export function SaveBadge({ price, compareAt }: { price: number; compareAt: number }) {
  const pct = Math.round(((compareAt - price) / compareAt) * 100);
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-[0.6rem] px-2.5 py-1 text-xs font-semibold text-white"
      style={{ background: "var(--badge-gradient)" }}
    >
      <svg viewBox="0 0 24 24" className="size-3.5 fill-white" aria-hidden="true">
        <path d="M21.41 11.58l-9-9A2 2 0 0011 2H4a2 2 0 00-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7A1.5 1.5 0 117 5.5 1.5 1.5 0 015.5 7z" />
      </svg>
      SAVE {pct}%
    </span>
  );
}

export default function Price({
  price,
  compareAt,
  badge = true,
  size = "lg",
}: {
  price: number;
  compareAt?: number;
  badge?: boolean;
  size?: "sm" | "lg";
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className={size === "lg" ? "text-[2rem] leading-none font-semibold" : "text-base font-semibold"}>
        {formatMoney(price)}
      </span>
      {compareAt && compareAt > price && (
        <s className={`text-muted ${size === "lg" ? "text-lg" : "text-sm"}`}>
          {formatMoney(compareAt)}
        </s>
      )}
      {badge && compareAt && compareAt > price && (
        <SaveBadge price={price} compareAt={compareAt} />
      )}
    </div>
  );
}
