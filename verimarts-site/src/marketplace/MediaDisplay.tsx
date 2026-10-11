import { useState } from "react";
import type { ListingImage } from "../data/marketplace";
import { refreshMediaUrl } from "../data/contentRepository";

/** Refresh a private Storage link once if an open listing outlives its token. */
export function MediaDisplay(props: {
  media: ListingImage;
  alt: string;
  controls?: boolean;
  muted?: boolean;
  className?: string;
}) {
  return (
    <MediaDisplaySource key={props.media.url || props.media.path} {...props} />
  );
}

function MediaDisplaySource({
  media,
  alt,
  controls = false,
  muted = false,
  className,
}: {
  media: ListingImage;
  alt: string;
  controls?: boolean;
  muted?: boolean;
  className?: string;
}) {
  const [src, setSrc] = useState(media.url || "");
  const [retried, setRetried] = useState(false);
  async function renew() {
    if (retried) return;
    setRetried(true);
    try {
      setSrc(await refreshMediaUrl(media.path));
    } catch {
      setSrc("");
    }
  }
  if (!src)
    return (
      <div
        className="listing-no-image"
        role="img"
        aria-label={`${alt}: media could not be loaded`}
      >
        Media could not be loaded
      </div>
    );
  return media.media_type === "video" ? (
    <video
      src={src}
      aria-label={alt}
      className={className}
      controls={controls}
      muted={muted}
      playsInline
      preload="metadata"
      onError={() => void renew()}
    />
  ) : (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => void renew()}
    />
  );
}
