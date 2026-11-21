/** Estrelas em quadradinhos verdes (estilo Trustpilot) */
export default function TrustStars({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex gap-[2px] ${className}`} role="img" aria-label="Rated 5 out of 5">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className="flex items-center justify-center bg-trust" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" style={{ width: size * 0.72, height: size * 0.72 }} className="fill-white" aria-hidden="true">
            <path d="M12 2.5l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.4l-6.1 3.5 1.5-6.8-5.2-4.6 6.9-.7z" />
          </svg>
        </span>
      ))}
    </span>
  );
}
