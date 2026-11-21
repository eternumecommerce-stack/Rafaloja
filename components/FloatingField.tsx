import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const base =
  "peer w-full rounded-md border bg-white px-4 text-base text-foreground outline-none transition-colors focus:border-ink focus:ring-1 focus:ring-ink";
const labelBase =
  "pointer-events-none absolute left-4 text-base text-ink/65 transition-all peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px]";

type Common = { id: string; label: string; error?: string | null };

/** Campo com label flutuante (estilo dos formulários do tema). */
export function FloatingInput({ id, label, error, className = "", ...props }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <div className="relative">
        <input
          id={id}
          placeholder=" "
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${base} h-[52px] pt-4 ${error ? "border-red ring-1 ring-red" : "border-ink/45"}`}
          {...props}
        />
        <label htmlFor={id} className={`${labelBase} top-1/2 -translate-y-1/2`}>
          {label}
        </label>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[13px] text-red">
          {error}
        </p>
      )}
    </div>
  );
}

export function FloatingTextarea({ id, label, error, className = "", ...props }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={className}>
      <div className="relative">
        <textarea
          id={id}
          placeholder=" "
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${base} min-h-40 resize-y pb-3 pt-6 ${error ? "border-red ring-1 ring-red" : "border-ink/45"}`}
          {...props}
        />
        <label htmlFor={id} className={`${labelBase} top-4`}>
          {label}
        </label>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[13px] text-red">
          {error}
        </p>
      )}
    </div>
  );
}
