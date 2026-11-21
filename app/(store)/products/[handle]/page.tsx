import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MainProduct from "@/components/product/MainProduct";
import Faq from "@/components/sections/Faq";
import { getProductPage } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/products/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const data = await getProductPage(handle);
  if (!data) return {};
  const image = data.product.gallery[0]?.url;
  return {
    title: data.product.title,
    description: data.product.subtitle,
    openGraph: image ? { images: [{ url: image }] } : undefined,
  };
}

// O `handle` vem da URL: lido dentro do <Suspense> para a casca da página (header, rodapé) sair na hora
export default function ProductPage({ params }: PageProps<"/products/[handle]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetails params={params} />
    </Suspense>
  );
}

async function ProductDetails({ params }: { params: PageProps<"/products/[handle]">["params"] }) {
  const { handle } = await params;
  const data = await getProductPage(handle);
  if (!data) notFound();

  return (
    <>
      <MainProduct product={data.product} offers={data.offers} />
      <Faq faqs={data.faqs} />
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="page-width pb-16 md:grid md:grid-cols-[minmax(0,65fr)_minmax(0,35fr)] md:gap-10 md:pt-2" aria-hidden="true">
      <div className="-mx-6 aspect-square bg-placeholder md:mx-0" />
      <div className="space-y-3 pt-6">
        <div className="h-4 w-40 bg-placeholder" />
        <div className="h-7 w-3/4 bg-placeholder" />
        <div className="h-6 w-1/2 bg-placeholder" />
        <div className="h-40 w-full bg-placeholder" />
        <div className="h-[50px] w-full rounded-md bg-placeholder" />
      </div>
    </div>
  );
}
