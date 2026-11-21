// Identidade e textos fixos da loja (header, rodapé, menu). Troque aqui o nome/contato da marca.

export const brand = {
  name: "Stivon Shoes",
  /** Palavra grande do logo em texto (usada só se `logoSrc` estiver vazio) */
  wordmark: "STIVON",
  tagline: "ORTHOPEDIC FOOTWEAR",
  /** Arquivo do logo em /public (proporção 5:2). Vazio = logo em texto. */
  logoSrc: "/midia/logo/stivon-logo.png",
  description: "Comfortable orthopedic footwear for everyday walking.",
};

export const announcements = [
  "EXCLUSIVE: UP TO 70% OFF",
  "FREE SHIPPING ON ALL ORDERS TODAY ONLY",
  "7-DAY MONEY-BACK GUARANTEE",
];

/** Coleções da home, na ordem em que aparecem */
export const collections = [
  { handle: "trainers", title: "Trainers", scheme: "light" },
  // Faixa azul-clara com título branco
  { handle: "orthopedic", title: "Premium Orthopedic Shoes", scheme: "blue" },
] as const;

export const menuLinks = [
  { label: "Orthopedic Shoes", href: "/#orthopedic" },
  { label: "Trainers", href: "/#trainers" },
  { label: "Track Your Order", href: "/pages/track-your-order" },
  { label: "Contact", href: "/pages/contact" },
];

export const customerService = {
  hours: "Monday - Friday, 8:30 AM EST to 5:30 PM",
  address: "700 Lincoln Rd Ste A, Miami Beach, FL 33139, Estados Unidos",
  email: "support@stivon.shop",
};

export const policyLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms & Conditions", href: "#" },
  { label: "Shipping Policy", href: "#" },
  { label: "Returns & Refunds Policy", href: "#" },
  { label: "Cookies Policy", href: "#" },
  { label: "Warranty Policy", href: "#" },
];

export const institutionalLinks = [
  { label: "About Us", href: "#" },
  { label: "Press & Collaborations", href: "#" },
  { label: "Careers", href: "#" },
];

export const newsletter = {
  title: "Subscribe to our emails",
  text: "Be the first to know about new collections and exclusive offers.",
};

/** Foto de cada brinde dos pacotes (pelo texto do brinde) */
export const giftImages: Record<string, string> = {
  "2-Pack Socks (Free Gift)": "/midia/brindes/meias-2-pares.jpg",
  "3-Pack Socks (Free Gift)": "/midia/brindes/meias-3-pares.jpg",
};

/** Rótulos das variações na página do produto */
export const variantLabels = { color: "Color", size: "Shoe size" };

/** Carrinho: frete grátis a partir deste valor (barra de progresso no topo do carrinho) */
export const freeShippingThreshold = 49.99;
export const shippingNote = "🇺🇸 Free Shipping to United States";

/** Dias úteis até o envio (selo "Ships by ...") */
export const shipsInBusinessDays = 2;
