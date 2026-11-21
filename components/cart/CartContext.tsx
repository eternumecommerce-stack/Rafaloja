"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { unitsInLine, splitVariant, type CartProduct } from "@/lib/product";
import { repackProduct } from "@/lib/cart-bundles";

export type CartLine = CartProduct & { qty: number };

type State = { lines: CartLine[]; open: boolean; ready: boolean };

const STORAGE_KEY = "store-cart";

type Action =
  | { type: "add"; items: CartProduct[] }
  | { type: "setQty"; id: string; qty: number }
  | { type: "remove"; id: string }
  | { type: "setPick"; key: string; pick: string; qty: number }
  | { type: "open"; open: boolean }
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "clear" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add": {
      let lines = [...state.lines];
      for (const item of action.items) {
        // Produto com pacotes: junta os pares novos aos que já estão no carrinho e reagrupa
        // (ex.: Duo + Single do mesmo produto vira Triple)
        if (item.bundle) {
          const { variant } = splitVariant(item.id);
          const newPicks = variant ? variant.split(" | ") : [];
          lines = repackProduct(lines, item.bundle.key, (picks) => [...picks, ...newPicks], item);
          continue;
        }
        const existing = lines.findIndex((l) => l.id === item.id);
        if (existing >= 0) {
          lines[existing] = { ...lines[existing], qty: lines[existing].qty + 1 };
        } else {
          // Guarda só os campos do carrinho (o produto da página traz accordions, HTML etc.)
          const { id, title, subtitle, price, compareAt, image, colorImages, gifts } = item;
          lines.push({ id, title, subtitle, price, compareAt, image, colorImages, gifts, qty: 1 });
        }
      }
      return { ...state, lines, open: true };
    }
    case "setQty":
      return {
        ...state,
        lines: state.lines
          .map((l) => (l.id === action.id ? { ...l, qty: action.qty } : l))
          .filter((l) => l.qty > 0),
      };
    case "remove":
      return { ...state, lines: state.lines.filter((l) => l.id !== action.id) };
    case "setPick":
      // Muda quantos pares de uma cor/tamanho existem e reagrupa os pacotes do produto
      return {
        ...state,
        lines: repackProduct(state.lines, action.key, (picks) => {
          const others = picks.filter((p) => p !== action.pick);
          const firstAt = picks.indexOf(action.pick);
          const mine = Array.from({ length: Math.max(0, action.qty) }, () => action.pick);
          // mantém a ordem: os pares dessa cor ficam onde estavam
          return firstAt < 0 ? [...others, ...mine] : [...others.slice(0, firstAt), ...mine, ...others.slice(firstAt)];
        }),
      };
    case "open":
      return { ...state, open: action.open };
    case "hydrate":
      return { ...state, lines: action.lines, ready: true };
    case "clear":
      return { ...state, lines: [], open: false };
  }
}

type CartApi = {
  lines: CartLine[];
  open: boolean;
  /** true depois de ler o carrinho salvo no navegador */
  ready: boolean;
  count: number;
  subtotal: number;
  add: (...items: CartProduct[]) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  /** Quantidade de pares de uma cor/tamanho de um produto com pacotes (0 = remove) */
  setPick: (key: string, pick: string, qty: number) => void;
  setOpen: (open: boolean) => void;
  has: (id: string) => boolean;
  clear: () => void;
};

const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [], open: false, ready: false });

  // Carrinho persiste no navegador para sobreviver à ida ao checkout e a um refresh
  useEffect(() => {
    let lines: CartLine[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) lines = JSON.parse(raw);
    } catch {}
    dispatch({ type: "hydrate", lines: Array.isArray(lines) ? lines : [] });
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
    } catch {}
  }, [state.lines, state.ready]);

  const add = useCallback(
    (...items: CartProduct[]) => dispatch({ type: "add", items }),
    [],
  );
  const setQty = useCallback(
    (id: string, qty: number) => dispatch({ type: "setQty", id, qty }),
    [],
  );
  const remove = useCallback((id: string) => dispatch({ type: "remove", id }), []);
  const setPick = useCallback(
    (key: string, pick: string, qty: number) => dispatch({ type: "setPick", key, pick, qty }),
    [],
  );
  const setOpen = useCallback(
    (open: boolean) => dispatch({ type: "open", open }),
    [],
  );
  const clear = useCallback(() => dispatch({ type: "clear" }), []);

  const value = useMemo<CartApi>(
    () => ({
      lines: state.lines,
      open: state.open,
      ready: state.ready,
      // Conta pares: um Duo no carrinho vale 2
      count: state.lines.reduce((n, l) => n + l.qty * unitsInLine(l.id), 0),
      subtotal: state.lines.reduce((n, l) => n + l.qty * l.price, 0),
      add,
      setQty,
      remove,
      setPick,
      setOpen,
      has: (id) => state.lines.some((l) => l.id === id),
      clear,
    }),
    [state, add, setQty, remove, setPick, setOpen, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
