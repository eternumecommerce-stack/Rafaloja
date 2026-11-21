type Props = {
  ratio?: string;
  rounded?: string;
  video?: boolean;
  className?: string;
  label?: string;
};

export default function MediaPlaceholder({
  ratio = "1 / 1",
  rounded = "rounded-xl",
  video = false,
  className = "",
  label,
}: Props) {
  return (
    <div
      role="img"
      aria-label={label ?? (video ? "Video placeholder" : "Image placeholder")}
      className={`relative w-full bg-placeholder ${rounded} ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {video && (
        <span className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-sm md:size-12">
          <svg viewBox="0 0 24 24" className="ml-0.5 size-4 fill-foreground md:size-5">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      )}
    </div>
  );
}
