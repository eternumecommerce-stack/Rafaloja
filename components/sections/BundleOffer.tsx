"use client";

import { useCart } from "@/components/cart/CartContext";
import Icon from "@/components/Icon";
import type { ProductPageData } from "@/lib/data";
import { formatMoney } from "@/lib/product";
import ImageWithText from "./ImageWithText";

export default function BundleOffer({
  bundle,
}: {
  bundle: NonNullable<ProductPageData["bundle"]>;
}) {
  const { add } = useCart();
  const { items, ...cartItem } = bundle;

  return (
    <div className="bg-white">
      <h2 className="page-width py-[9px] text-center text-[26px] text-ink md:py-3 md:text-[31px]">
        {bundle.title}
      </h2>
      <ImageWithText
        src={bundle.image}
        alt={bundle.title}
        mobileContentFirst={false}
        boxClassName="bg-white text-foreground"
        sectionClassName="bg-white pb-4 md:pt-7"
      >
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.text} className="flex items-center gap-2.5 text-[15px] font-medium">
              <Icon name={item.icon} size={22} className="text-accent" />
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={() => add(cartItem)}
          className="mt-7 flex h-[54px] w-full items-center justify-center rounded-md bg-bundle-btn text-[1.05rem] font-semibold text-white"
        >
          Add to Cart
        </button>
        <p className="mt-2.5 text-[21px] text-[rgb(220,147,91)]">
          <strong className="text-accent">{formatMoney(bundle.price)}</strong>{" "}
          {bundle.compareAt && formatMoney(bundle.compareAt)}
        </p>
      </ImageWithText>
    </div>
  );
}
