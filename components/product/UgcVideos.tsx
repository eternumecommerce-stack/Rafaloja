import Media from "@/components/Media";

type UgcVideo = { url: string | null; poster: string | null; alt: string };

export default function UgcVideos({ videos }: { videos: UgcVideo[] }) {
  if (videos.length === 0) return null;
  return (
    <div className="mt-2.5">
      <p className="text-center text-[15px] font-bold">Trusted by 5,000+ people!</p>
      <ul className="mt-4 grid grid-cols-3 gap-2">
        {videos.map((v, i) => (
          <li key={i}>
            <Media src={v.url} poster={v.poster} alt={v.alt} ratio="1 / 1.792" video playback="click" />
          </li>
        ))}
      </ul>
    </div>
  );
}
