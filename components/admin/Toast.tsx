"use client";

import { useCallback, useRef, useState } from "react";
import Icon from "@/components/Icon";

type ToastState = { type: "success" | "error"; msg: string } | null;

/** Aviso flutuante no canto da tela ("Salvo" / erro). */
export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((type: "success" | "error", msg: string) => {
    clearTimeout(timer.current);
    setToast({ type, msg });
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const node = toast ? (
    <div
      role="status"
      className={`fixed bottom-5 right-5 z-[60] flex max-w-[calc(100vw-2.5rem)] items-center gap-2.5 rounded-2xl px-4 py-3 text-[13px] font-semibold shadow-2xl ${
        toast.type === "success" ? "bg-emerald-500 text-black" : "bg-rose-500 text-white"
      }`}
    >
      <Icon name={toast.type === "success" ? "check_circle" : "error"} size={18} fill />
      {toast.msg}
    </div>
  ) : null;

  return { show, node };
}
