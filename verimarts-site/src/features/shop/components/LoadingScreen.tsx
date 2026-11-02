import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Logo } from "../../../brand/Logo";
import { business } from "../../../config/business";

const VIDEO_SECONDS = 5;
/** Pictures the first screen needs, warmed up behind the film. */
const preload = [
  "/media/editorial/hero-main.webp",
  "/media/editorial/hero-side.webp",
];
const curtains = ["marigold", "hibiscus", "indigo"] as const;

/**
 * First-visit loading page: the FASHYN reveal film over brand colour, with real loading progress.
 * Skippable, keyboard-friendly, and falls back to the still logo if the film cannot play.
 */
export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const skip = useRef<HTMLButtonElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [filmFailed, setFilmFailed] = useState(false);
  const [assets, setAssets] = useState(0);
  const [played, setPlayed] = useState(0);
  useEffect(() => {
    skip.current?.focus();
    const timer = setTimeout(onDone, reduced ? 450 : (VIDEO_SECONDS + 1.5) * 1000);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDone();
      if (event.key === "Tab") {
        event.preventDefault();
        skip.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
    };
  }, [onDone, reduced]);
  useEffect(() => {
    let active = true;
    const tasks: Promise<unknown>[] = [
      ...preload.map(
        (src) =>
          new Promise((resolve) => {
            const image = new Image();
            image.onload = image.onerror = resolve;
            image.src = src;
          }),
      ),
      document.fonts?.ready ?? Promise.resolve(),
    ];
    tasks.forEach((task) =>
      task.then(() => {
        if (active) setAssets((count) => count + 1 / tasks.length);
      }),
    );
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!filmFailed || reduced) return;
    // Without the film there is nothing to wait for beyond the assets themselves.
    if (assets >= 0.99) {
      const timer = setTimeout(onDone, 500);
      return () => clearTimeout(timer);
    }
  }, [filmFailed, assets, onDone, reduced]);
  useEffect(() => {
    video.current?.play().catch(() => setFilmFailed(true));
  }, []);
  const progress = Math.round(
    (filmFailed ? assets : assets * 0.3 + played * 0.7) * 100,
  );
  const showFilm = !reduced && !filmFailed;
  return (
    <motion.div
      className="loader"
      role="dialog"
      aria-modal="true"
      aria-label="FASHYN is loading"
      exit={reduced ? { opacity: 0 } : { y: "-100%" }}
      transition={{ duration: reduced ? 0 : 0.7, ease: [0.76, 0, 0.24, 1] }}
    >
      {!reduced &&
        curtains.map((colour, index) => (
          <motion.span
            key={colour}
            className={`loader__curtain loader__curtain--${colour}`}
            aria-hidden="true"
            initial={{ y: 0 }}
            animate={{ y: "-100%" }}
            transition={{
              delay: 0.05 + index * 0.1,
              duration: 0.7,
              ease: [0.76, 0, 0.24, 1],
            }}
          />
        ))}
      <div className="loader__stage">
        {showFilm && (
          <video
            ref={video}
            className="loader__film"
            muted
            autoPlay
            playsInline
            preload="auto"
            poster="/media/fashyn-reveal-poster.jpg"
            aria-hidden="true"
            onTimeUpdate={(event) => {
              const { currentTime, duration } = event.currentTarget;
              if (duration) setPlayed(Math.min(1, currentTime / duration));
            }}
            onEnded={onDone}
            onError={() => setFilmFailed(true)}
          >
            <source src="/media/fashyn-reveal.mp4" type="video/mp4" />
          </video>
        )}
        {!showFilm && <Logo className="loader__logo" />}
      </div>
      <div className="loader__footer">
        <p className="loader__tagline">{business.tagline}</p>
        <div className="loader__progress">
          <span
            className="loader__bar"
            role="progressbar"
            aria-label="Loading FASHYN"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </div>
        <div className="loader__row">
          <span className="loader__count" aria-hidden="true">
            {String(progress).padStart(2, "0")}%
          </span>
          <button ref={skip} className="loader__skip" onClick={onDone}>
            Skip intro <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
