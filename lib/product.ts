// Tipos e dados estáticos da "casca" da loja. O conteúdo do produto vem do banco (lib/data.ts).

export type CartProduct = {
  id: string;
  title: string;
  subtitle?: string;
  price: number;
  compareAt?: number;
  /** Foto usada no carrinho / checkout */
  image?: string;
  /** Pacote (Duo, Triple...): foto de cada cor escolhida, para mostrar cada par no carrinho */
  colorImages?: Record<string, string>;
  /** Brindes do pacote (aparecem como FREE no carrinho) */
  gifts?: string[];
  /** Produto com pacotes (Single/Duo/Triple): o carrinho mostra cada par separado e reagrupa sozinho */
  bundle?: BundleInfo;
};

export type BundleOffer = {
  /** id do carrinho da oferta ("offer:...") */
  id: string;
  quantity: number;
  title: string;
  price: number;
  compareAt?: number;
  gifts: string[];
};

export type BundleInfo = {
  /** Produto (handle): os pares do mesmo produto são reagrupados juntos */
  key: string;
  title: string;
  offers: BundleOffer[];
};

export const formatMoney = (n: number) => `$${n.toFixed(2)}`;

// ───────────── Variações (cor / tamanho) ─────────────
//
// A linha do carrinho leva a variação no próprio id: `<id>::Grey / 9 | Black / 10`.
// Assim o mesmo produto em cores/tamanhos diferentes vira linhas diferentes, e o servidor
// recebe a escolha junto com o id (e valida contra as cores/tamanhos do banco).

export const VARIANT_SEP = "::";

export type VariantPick = { color?: string; size?: string };

/** "Grey / 9" (só as partes que existem) */
export const pickLabel = (p: VariantPick) => [p.color, p.size].filter(Boolean).join(" / ");

/** Uma unidade por item do pacote: "Grey / 9 | Black / 10" */
export const variantLabel = (picks: VariantPick[]) => picks.map(pickLabel).filter(Boolean).join(" | ");

export const withVariant = (id: string, variant: string) => (variant ? `${id}${VARIANT_SEP}${variant}` : id);

export function splitVariant(id: string): { baseId: string; variant: string } {
  const i = id.indexOf(VARIANT_SEP);
  return i < 0 ? { baseId: id, variant: "" } : { baseId: id.slice(0, i), variant: id.slice(i + VARIANT_SEP.length) };
}

/** Quantos pares (unidades do produto) uma linha do carrinho tem: Duo = 2, Triple = 3, avulso = 1 */
export const unitsInLine = (id: string) => {
  const { variant } = splitVariant(id);
  return variant ? variant.split(" | ").length : 1;
};

export const countries = [
  "Australia | AUD $",
  "New Zealand | NZD $",
  "United States | USD $",
];

export const paymentMethods = [
  "Amex",
  "Apple Pay",
  "G Pay",
  "Klarna",
  "Maestro",
  "Mastercard",
  "PayPal",
  "Shop Pay",
  "UnionPay",
  "Visa",
];

export const footerLinks = [
  { label: "Privacy policy", href: "#" },
  { label: "Refund policy", href: "#" },
  { label: "Terms of service", href: "#" },
  { label: "Contact information", href: "/pages/contact" },
  { label: "Shipping policy", href: "#" },
];
