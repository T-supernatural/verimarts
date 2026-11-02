import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { letterShapes, Logo } from "../../../brand/Logo";
import { business } from "../../../config/business";
import "./loader.css";

/** "The Lookbook": an original, code-driven title sequence. All times are milliseconds. */
const REEL_ENDS = 2600;
const FIRST_CUT = 800;
const CUT_EVERY = 300;
const SEQUENCE_ENDS = 4600;
const GIVE_UP_AFTER = 7000;

const photoNames = [
  "ember",
  "saffron",
  "rose",
  "merlot",
  "marigold",
  "verdant",
  "camel",
  "apricot",
  "onyx",
  "sailor",
  "bloom",
  "coastline",
];
const photos = photoNames.map((name) => `/media/loader/${name}.webp`);
/** Pictures the first screen of the store needs, warmed up behind the sequence. */
const storeImages = [
  "/media/editorial/hero-main.webp",
  "/media/editorial/hero-side.webp",
];
const tones = ["indigo", "hibiscus", "marigold"];

const slatMotion: Variants = {
  // Viewport units: on phones a panel is half the screen tall, so 100% would not clear it.
  hidden: (index: number) => ({ y: index % 2 ? "-105vh" : "105vh" }),
  in: (index: number) => ({
    y: "0vh",
    transition: { delay: index * 0.07, duration: 0.75, ease: [0.76, 0, 0.24, 1] },
  }),
  out: (index: number) => ({
    y: index % 2 ? "105vh" : "-105vh",
    transition: { delay: index * 0.05, duration: 0.65, ease: [0.76, 0, 0.24, 1] },
  }),
};
/** The sheet lifts away from its bottom edge: the A's chevron opens first, then the rest follows. */
const closed = "polygon(0% 0%, 100% 0%, 100% 100%, 50% 100%, 0% 100%)";
const opening = "polygon(0% 0%, 100% 0%, 100% 100%, 50% 42%, 0% 100%)";
const gone = "polygon(0% 0%, 100% 0%, 100% 0%, 50% 0%, 0% 0%)";
const sheet = (delay: number): Variants => ({
  shown: { clipPath: closed },
  exit: {
    clipPath: [closed, opening, gone],
    transition: {
      delay,
      duration: 0.85,
      times: [0, 0.45, 1],
      ease: [0.76, 0, 0.24, 1],
    },
  },
});

function preload(sources: string[], onEach: () => void) {
  sources.forEach((src) => {
    const image = new Image();
    image.onload = image.onerror = onEach;
    image.src = src;
  });
}

/** First-visit loading page. Skippable, keyboard-friendly, and static under reduced motion. */
export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const skip = useRef<HTMLButtonElement>(null);
  const finished = useRef(false);
  const [elapsed, setElapsed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const total = photos.length + storeImages.length + 1;
  useEffect(() => {
    let active = true;
    const count = () => {
      if (active) setLoaded((value) => value + 1);
    };
    preload([...photos, ...storeImages], count);
    void (document.fonts?.ready ?? Promise.resolve()).then(count);
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const finish = () => {
      if (finished.current) return;
      finished.current = true;
      onDone();
    };
    skip.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
      if (event.key === "Tab") {
        event.preventDefault();
        skip.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const started = Date.now();
    const clock = setInterval(() => setElapsed(Date.now() - started), 50);
    const limit = setTimeout(finish, reduced ? 450 : GIVE_UP_AFTER);
    return () => {
      clearInterval(clock);
      clearTimeout(limit);
      document.removeEventListener("keydown", onKey);
    };
  }, [onDone, reduced]);
  const assetsReady = loaded >= total;
  useEffect(() => {
    if (reduced || !assetsReady || elapsed < SEQUENCE_ENDS || finished.current)
      return;
    finished.current = true;
    onDone();
  }, [assetsReady, elapsed, onDone, reduced]);
  // The stitch follows the sequence, but waits at 90% if the pictures are still arriving.
  const progress = Math.round(
    Math.min(
      (elapsed / SEQUENCE_ENDS) * 100,
      assetsReady ? 100 : 25 + (loaded / total) * 65,
    ),
  );
  const cut = Math.max(0, Math.floor((elapsed - FIRST_CUT) / CUT_EVERY) + 1);
  const scene = elapsed < REEL_ENDS ? "in" : "out";
  const skipButton = (
    <button
      ref={skip}
      className="loader__skip"
      onClick={() => {
        if (finished.current) return;
        finished.current = true;
        onDone();
      }}
    >
      Skip intro <ArrowRight size={16} aria-hidden="true" />
    </button>
  );
  const stitch = (
    <div
      className="stitch"
      role="progressbar"
      aria-label="Loading FASHYN"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
    >
      <span
        className="stitch__thread"
        style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}
      />
      <span className="stitch__needle" style={{ left: `${progress}%` }} />
    </div>
  );
  if (reduced)
    return (
      <motion.div
        className="loader"
        role="dialog"
        aria-modal="true"
        aria-label="FASHYN is loading"
        exit={{ opacity: 0, transition: { duration: 0 } }}
      >
        <div className="loader__sheet loader__sheet--front">
          <div className="loader__title">
            <Logo className="loader__logo" />
            <p className="loader__tagline">{business.tagline}</p>
          </div>
          <div className="loader__footer">
            {stitch}
            <div className="loader__row">{skipButton}</div>
          </div>
        </div>
      </motion.div>
    );
  return (
    <motion.div
      className="loader"
      role="dialog"
      aria-modal="true"
      aria-label="FASHYN is loading"
      initial="shown"
      animate="shown"
      exit="exit"
    >
      <motion.div
        className="loader__sheet loader__sheet--hibiscus"
        variants={sheet(0.18)}
      />
      <motion.div
        className="loader__sheet loader__sheet--marigold"
        variants={sheet(0.09)}
      />
      <motion.div
        className="loader__sheet loader__sheet--front"
        variants={sheet(0)}
      >
        <span className="loader__weave" aria-hidden="true" />
        {scene === "out" && (
          <div className="loader__title">
            <motion.div
              initial={{ opacity: 0, scale: 1.14 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <Logo className="loader__logo" />
            </motion.div>
            <p className="loader__tagline">
              {business.tagline.split(" ").map((word, index) => (
                <motion.span
                  key={word}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75 + index * 0.08, duration: 0.45 }}
                >
                  {word}{" "}
                </motion.span>
              ))}
            </p>
          </div>
        )}
        <div className="loader__reel" aria-hidden="true">
          {letterShapes.map((letter, index) => (
            <motion.div
              key={letter.key}
              className={`slat slat--${tones[index % tones.length]}`}
              custom={index}
              variants={slatMotion}
              initial="hidden"
              animate={scene}
            >
              <img
                key={cut}
                className="slat__photo"
                src={photos[(index + cut * 5) % photos.length]}
                alt=""
                onError={(event) => {
                  event.currentTarget.style.visibility = "hidden";
                }}
              />
              <svg
                className="slat__letter"
                viewBox={`${letter.x} 0 ${letter.width} 188`}
                style={{ aspectRatio: `${letter.width} / 188` }}
              >
                <path d={letter.d} fill="currentColor" />
              </svg>
            </motion.div>
          ))}
        </div>
        <div className="loader__footer">
          {stitch}
          <div className="loader__row">
            <span className="loader__status" aria-hidden="true">
              <b>{String(progress).padStart(2, "0")}%</b>
              Preparing the collection
            </span>
            {skipButton}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
