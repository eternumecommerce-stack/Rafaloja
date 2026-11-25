/** Meta Pixel: o ID vem do .env (NEXT_PUBLIC_META_PIXEL_ID). Sem ID, nada é carregado nem disparado. */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: Fbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/** Cria a fila padrão do Meta: eventos disparados antes do script carregar ficam guardados. */
function ensureFbq(): Fbq | null {
  if (typeof window === "undefined" || !META_PIXEL_ID) return null;
  if (!window.fbq) {
    const f = function (...args: unknown[]) {
      if (f.callMethod) f.callMethod(...args);
      else f.queue.push(args);
    } as Fbq;
    f.push = f;
    f.loaded = true;
    f.version = "2.0";
    f.queue = [];
    window.fbq = f;
    if (!window._fbq) window._fbq = f;
    f("init", META_PIXEL_ID);
  }
  return window.fbq;
}

/** Evento padrão do Meta (PageView, ViewContent, AddToCart, InitiateCheckout, Purchase...). */
export function trackPixel(event: string, params?: Record<string, unknown>, eventID?: string) {
  const fbq = ensureFbq();
  if (!fbq) return;
  if (eventID) fbq("track", event, params ?? {}, { eventID });
  else if (params) fbq("track", event, params);
  else fbq("track", event);
}
