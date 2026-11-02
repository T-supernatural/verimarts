import { useState } from "react";
import { Shirt } from "lucide-react";
import type { ListingImage } from "../../../data/marketplace";
import { refreshMediaUrl } from "../../../data/contentRepository";

/** Refresh a private Storage link once if an open page outlives its token. */
export function MediaDisplay(props: {
  media: ListingImage;
  alt: string;
  controls?: boolean;
  muted?: boolean;
  className?: string;
  eager?: boolean;
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
  eager = false,
}: {
  media: ListingImage;
  alt: string;
  controls?: boolean;
  muted?: boolean;
  className?: string;
  eager?: boolean;
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
        className="media-missing"
        role="img"
        aria-label={`${alt}: image unavailable`}
      >
        <Shirt size={28} aria-hidden="true" />
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
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => void renew()}
    />
  );
}
