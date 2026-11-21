export default function Stars({
  rating = 5,
  color = "var(--star)",
  size = 18,
}: {
  rating?: number;
  color?: string;
  size?: number;
}) {
  return (
    <span
      className="inline-flex gap-0.5"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        // Id inclui a cor: estrelas com a mesma nota e cores diferentes não podem compartilhar o gradiente
        const id = `star-${rating}-${color.replace(/[^a-z0-9]/gi, "")}-${i}`;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24">
            <defs>
              <linearGradient id={id}>
                <stop offset={`${fill * 100}%`} stopColor={color} />
                <stop offset={`${fill * 100}%`} stopColor="#d9d9d9" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#${id})`}
              d="M12 2.5l2.94 6.1 6.56.86-4.8 4.6 1.2 6.54L12 17.4l-5.9 3.2 1.2-6.54-4.8-4.6 6.56-.86z"
            />
          </svg>
        );
      })}
    </span>
  );
}
