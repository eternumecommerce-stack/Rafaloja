import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy: lista do que a página pode carregar. Bloqueia scripts, iframes e
 * conexões de origens não listadas (mitiga XSS, clickjacking e vazamento de dados).
 * Sem nonce porque as páginas são estáticas/pré-renderizadas; por isso 'unsafe-inline' para
 * os scripts inline do Next.
 */
const csp = [
  "default-src 'self'",
  // Stripe (pagamento), 17track (rastreio da transportadora) e Meta Pixel
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://js.stripe.com https://*.js.stripe.com https://maps.googleapis.com https://www.17track.net https://connect.facebook.net`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://flagcdn.com https://*.stripe.com https://www.facebook.com",
  "media-src 'self'",
  // Chamadas do Stripe.js (inclui buscar a fonte dos campos de pagamento); em dev o Next usa websocket
  `connect-src 'self' https://api.stripe.com https://*.stripe.com https://maps.googleapis.com https://fonts.googleapis.com https://fonts.gstatic.com https://www.facebook.com https://connect.facebook.net${isDev ? " ws: wss:" : ""}`,
  "frame-src https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com https://*.17track.net",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Ninguém pode colocar a loja dentro de um iframe (clickjacking)
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desliga APIs do navegador que a loja não usa; "payment" liberado só para o Stripe (Apple/Google Pay)
  {
    key: "Permissions-Policy",
    value:
      'camera=(), microphone=(), geolocation=(), usb=(), browsing-topics=(), payment=(self "https://js.stripe.com")',
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  // HTTPS obrigatório por 2 anos (só em produção; em localhost não faz sentido)
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  // Não anuncia "X-Powered-By: Next.js"
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
