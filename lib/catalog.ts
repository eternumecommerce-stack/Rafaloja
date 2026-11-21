// Catálogo da loja de calçados. Fonte única para o seed do banco (prisma/seed.ts) e para o
// modo demonstração sem banco (STORE_DEMO=1, ver lib/data.ts).
// Fotos em public/midia/produtos/<handle>/ (galeria na ordem dos arquivos de `photos`).

const sizesUpTo = (max: number) => {
  const out: string[] = [];
  for (let s = 6; s <= max; s += 0.5) out.push(String(s));
  return out;
};

export type CatalogColor = { name: string; /** arquivo da foto dessa cor (dentro da pasta do produto) */ photo: string };

export type CatalogProduct = {
  handle: string;
  title: string;
  subtitle?: string;
  price: number;
  compareAtPrice?: number;
  ratingLabel?: string;
  collection: "trainers" | "orthopedic";
  position: number;
  colors: CatalogColor[];
  sizes: string[];
  /** Arquivos da galeria, na ordem (o 1º também é a foto do carrinho e da grade da home) */
  photos: string[];
  /** Preços próprios dos pacotes Duo e Triple ([preço, preço "de"]); sem isso = 2x e 3x o preço */
  bundlePrices?: { duo: [number, number]; triple: [number, number] };
};

/** Caminho público de uma foto do produto */
export const photoUrl = (handle: string, file: string) => `/midia/produtos/${handle}/${file}`;

const files = (n: number, ext: (i: number) => string = () => "jpg") =>
  Array.from({ length: n }, (_, i) => `${String(i + 1).padStart(2, "0")}.${ext(i + 1)}`);

type BaseProduct = Omit<CatalogProduct, "colors" | "sizes" | "photos" | "bundlePrices">;

const base: BaseProduct[] = [
  // Premium Orthopedic Shoes
  {
    handle: "trail-trekking-shoes",
    title: "Trail Trekking Shoes",
    subtitle: "Orthopedic hiking shoe with cushioned support",
    price: 119,
    compareAtPrice: 200,
    ratingLabel: "212 Reviews",
    collection: "orthopedic",
    position: 0,
  },
  {
    handle: "black-walking-shoe",
    title: "Black Walking Shoe",
    subtitle: "Waterproof orthopedic walking shoe",
    price: 98.5,
    compareAtPrice: 197,
    ratingLabel: "384 Reviews",
    collection: "orthopedic",
    position: 1,
  },
  {
    handle: "skyline-max-triple-waterproof",
    title: "Skyline Max Triple Waterproof",
    subtitle: "All-terrain waterproof trainer with high-rebound cushioning",
    price: 129.9,
    compareAtPrice: 259.8,
    ratingLabel: "5,063+ Reviews",
    collection: "orthopedic",
    position: 2,
  },
  // Trainers
  { handle: "knit-running-shoes", title: "Knit Running Shoes", price: 99, ratingLabel: "156 Reviews", collection: "trainers", position: 0 },
  { handle: "sport-training-shoes", title: "Sport Training Shoes", price: 89, ratingLabel: "98 Reviews", collection: "trainers", position: 1 },
  {
    handle: "flex-knit-comfort-sneakers",
    title: "Flex Knit Comfort Sneakers",
    price: 79,
    ratingLabel: "131 Reviews",
    collection: "trainers",
    position: 2,
  },
  { handle: "urban-running-sneakers", title: "Urban Running Sneakers", price: 79.89, ratingLabel: "117 Reviews", collection: "trainers", position: 3 },
];

/** Cores (com a foto de cada uma), tamanhos e galeria de cada produto */
const media: Record<string, Pick<CatalogProduct, "colors" | "sizes" | "photos" | "bundlePrices">> = {
  "skyline-max-triple-waterproof": {
    colors: [
      { name: "Black", photo: "01.webp" },
      { name: "White", photo: "07.webp" },
    ],
    sizes: sizesUpTo(13),
    photos: files(12, () => "webp"),
    // Preços dos pacotes como na Stivon (não são 2x/3x o preço)
    bundlePrices: { duo: [229.9, 519.6], triple: [299.9, 779.4] },
  },
  // 6 fotos por cor (3/4, lateral, frente, trás, cima, sola), cores na ordem abaixo
  "trail-trekking-shoes": {
    colors: [
      { name: "Gray", photo: "01.webp" },
      { name: "Black", photo: "07.webp" },
    ],
    sizes: sizesUpTo(13),
    photos: files(12, () => "webp"),
  },
  "black-walking-shoe": {
    colors: [
      { name: "Grey", photo: "01.webp" },
      { name: "White", photo: "07.webp" },
      { name: "Black", photo: "13.webp" },
    ],
    sizes: sizesUpTo(13),
    photos: files(18, () => "webp"),
  },
  "knit-running-shoes": {
    colors: [
      { name: "Blue", photo: "01.webp" },
      { name: "Orange", photo: "07.webp" },
    ],
    sizes: sizesUpTo(12),
    photos: files(12, () => "webp"),
  },
  "sport-training-shoes": {
    colors: [
      { name: "Black", photo: "01.webp" },
      { name: "Mint", photo: "07.webp" },
    ],
    sizes: sizesUpTo(12),
    photos: files(12, () => "webp"),
  },
  "flex-knit-comfort-sneakers": {
    colors: [
      { name: "Black", photo: "01.webp" },
    ],
    sizes: sizesUpTo(12),
    photos: files(6, () => "webp"),
  },
  "urban-running-sneakers": {
    colors: [
      { name: "Gray", photo: "01.webp" },
    ],
    sizes: sizesUpTo(11.5),
    photos: files(6, () => "webp"),
  },
};

export const catalogProducts: CatalogProduct[] = base.map((p) => ({ ...p, ...media[p.handle] }));

const round2 = (n: number) => Math.round(n * 100) / 100;

export type CatalogOffer = {
  quantity: number;
  title: string;
  caption: string;
  price: number;
  compareAtPrice: number;
  badge?: string;
  gifts: string[];
  giftValue?: number;
  isDefault: boolean;
};

/** "BUNDLE & SAVE": 1 par, 2 pares (+ meias de brinde) e 3 pares (+ meias de brinde) */
export function catalogOffers(p: CatalogProduct): CatalogOffer[] {
  const compare = p.compareAtPrice ?? p.price;
  return [
    { quantity: 1, title: "Single", caption: "Standard price", price: p.price, compareAtPrice: compare, gifts: [], isDefault: false },
    {
      quantity: 2,
      title: "Duo",
      caption: "",
      price: p.bundlePrices?.duo[0] ?? round2(p.price * 2),
      compareAtPrice: p.bundlePrices?.duo[1] ?? round2(compare * 2),
      gifts: ["2-Pack Socks (Free Gift)"],
      giftValue: 39.9,
      isDefault: true,
    },
    {
      quantity: 3,
      title: "Triple",
      caption: "",
      price: p.bundlePrices?.triple[0] ?? round2(p.price * 3),
      compareAtPrice: p.bundlePrices?.triple[1] ?? round2(compare * 3),
      badge: "Best value",
      gifts: ["3-Pack Socks (Free Gift)"],
      giftValue: 59.9,
      isDefault: false,
    },
  ];
}

export const catalogFaqs = [
  {
    question: "What are the delivery times?",
    answerHtml: `<p>Orders are processed within 1-2 business days. Delivery usually takes 5-10 business days after dispatch, depending on your location.</p>`,
  },
  {
    question: "How can I track my order?",
    answerHtml: `<p>As soon as your order ships, we email you a tracking number. You can also follow it anytime on our <a href="/pages/track-your-order">Track Your Order</a> page.</p>`,
  },
  {
    question: "What is your returns policy?",
    answerHtml: `<p>If you are not happy with your shoes, you can return them within 7 days of delivery for a full refund. Items must be unworn and in their original packaging. Just contact our support team to start a return.</p>`,
  },
  {
    question: "What should I do if my item is faulty?",
    answerHtml: `<p>Please contact our support team with your order number and a photo of the issue. We will send a replacement or issue a refund as quickly as possible.</p>`,
  },
];
