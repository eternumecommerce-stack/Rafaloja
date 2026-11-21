export default function Icon({
  name,
  className = "",
  size = 20,
  fill = false,
}: {
  name: string;
  className?: string;
  size?: number;
  fill?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined shrink-0 ${className}`}
      style={{
        fontSize: size,
        width: size,
        height: size,
        overflow: "hidden",
        fontVariationSettings: `"FILL" ${fill ? 1 : 0}, "wght" 400, "GRAD" 0, "opsz" 24`,
      }}
    >
      {name}
    </span>
  );
}
