import { useState } from "react";
import { Play } from "lucide-react";

/** The two videos under "How it works" — same on every offer page. Replace the placeholder
 *  YouTube id (the `v=` part of the link) and title here. */
const VIDEOS = [
  { id: "YOUTUBE_VIDEO_ID_1", title: "How we handle your samples" },
  // A YouTube Short — the id is the part after /shorts/.
  { id: "YOUTUBE_VIDEO_ID_2", title: "Book a blood test at home in a few taps" },
];

/** Shows the thumbnail first and swaps in the YouTube player only when the
 *  visitor presses play — two embedded players would otherwise load ~1 MB of
 *  YouTube script before anyone asks for them. */
function VideoCard({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className="flex flex-col gap-3">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-brand-navy">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 size-full"
            aria-label={`Play video: ${title}`}
          >
            <img
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-opacity group-hover:opacity-90"
            />
            <span className="absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-105">
              <Play className="ml-1 size-7 fill-current" aria-hidden />
            </span>
          </button>
        )}
      </div>
      <figcaption className="text-sm font-medium text-foreground">{title}</figcaption>
    </figure>
  );
}

function OfferVideos() {
  return (
    <div className="mt-10 grid gap-6 md:grid-cols-2">
      {VIDEOS.map((video, i) => (
        <VideoCard key={`${video.id}-${i}`} id={video.id} title={video.title} />
      ))}
    </div>
  );
}

export { OfferVideos };
