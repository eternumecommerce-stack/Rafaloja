"use client";

import { useRef, useState } from "react";

/** Vídeo que começa pausado com botão de play no centro; ao clicar toca com som e controles. */
export default function PlayableVideo({ src, poster, label }: { src: string; poster?: string; label?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  return (
    <>
      <video
        ref={ref}
        src={src}
        poster={poster}
        playsInline
        preload="none"
        controls={playing}
        aria-label={label}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        className="absolute inset-0 size-full object-cover"
      />
      {!playing && (
        <button
          type="button"
          aria-label={label ? `Play ${label}` : "Play video"}
          onClick={() => ref.current?.play()}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-white/85 shadow-md md:size-12">
            <svg viewBox="0 0 24 24" className="ml-0.5 size-4 fill-foreground md:size-5" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </>
  );
}
