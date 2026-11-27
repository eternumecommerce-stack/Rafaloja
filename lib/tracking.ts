// Parâmetros de origem do visitante (UTMs do anúncio). Lidos da URL quando ele chega na loja,
// guardados no navegador e enviados junto com o pedido para a UTMify.

export const TRACKING_KEYS = ["src", "sck", "utm_source", "utm_campaign", "utm_medium", "utm_content", "utm_term"] as const;

export type TrackingKey = (typeof TRACKING_KEYS)[number];
export type TrackingParams = Record<TrackingKey, string | null>;

export const TRACKING_STORAGE_KEY = "store-utm";
/** Quanto tempo a origem vale depois da visita (cliques de anúncio costumam ser atribuídos em até 30 dias) */
export const TRACKING_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export const emptyTracking = (): TrackingParams =>
  Object.fromEntries(TRACKING_KEYS.map((k) => [k, null])) as TrackingParams;

/** Aceita só as chaves conhecidas, como texto curto (o navegador pode mandar qualquer coisa) */
export function sanitizeTracking(input: unknown): TrackingParams {
  const out = emptyTracking();
  if (!input || typeof input !== "object") return out;
  for (const k of TRACKING_KEYS) {
    const v = (input as Record<string, unknown>)[k];
    if (typeof v === "string" && v.trim()) out[k] = v.trim().slice(0, 500);
  }
  return out;
}

export const hasTracking = (t: TrackingParams) => TRACKING_KEYS.some((k) => t[k]);

/** Lê a origem guardada no navegador (vazia se não houver ou se passou do prazo) */
export function readStoredTracking(): TrackingParams {
  try {
    const raw = localStorage.getItem(TRACKING_STORAGE_KEY);
    if (!raw) return emptyTracking();
    const { at, params } = JSON.parse(raw) as { at: number; params: unknown };
    if (typeof at !== "number" || Date.now() - at > TRACKING_MAX_AGE_MS) return emptyTracking();
    return sanitizeTracking(params);
  } catch {
    return emptyTracking();
  }
}
