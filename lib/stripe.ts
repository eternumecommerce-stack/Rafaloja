import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/**
 * Cliente do Stripe criado só no primeiro uso. Assim o build (e a loja) funcionam sem a
 * chave; ela só é exigida na hora de cobrar, reembolsar ou validar um webhook.
 */
function getStripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não definida (configure no .env / nas variáveis da Vercel)");
  client = new Stripe(key);
  return client;
}

/** Mesmo uso de antes (`stripe.paymentIntents.create(...)`), mas sem exigir a chave ao carregar o arquivo */
export const stripe = new Proxy({} as Stripe, {
  get: (_target, prop) => Reflect.get(getStripe(), prop),
});

export const stripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);
