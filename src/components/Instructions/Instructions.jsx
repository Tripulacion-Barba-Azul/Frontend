import { useEffect, useState } from "react";
import "./Instructions.css";

const ICON_SRC = "/Icons/instructionsIcon.png";
const RULE_IMAGES = [
  "/Rules/01-Rules.png",
  "/Rules/02-Rules.png",
  "/Rules/03-Rules.png",
  "/Rules/04-Rules.png",
  "/Rules/05-Rules.png",
  "/Rules/06-Rules.png",
  "/Rules/07-Rules.png",
  "/Rules/08-Rules.png",
  "/Rules/09-Rules.png",
];

// Single in-game help image
const IN_GAME_RULES = "/Rules/00-Rules.png";

export default function Instructions({ mode = "preGame" }) {
  // --- state ---
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  // --- helpers ---
  const isPreGame = mode === "preGame";
  const isInGame = mode === "inGame";
  const count = RULE_IMAGES.length;

  const next = () => setIndex((i) => (i + 1) % count);
  const prev = () => setIndex((i) => (i - 1 + count) % count);

  // Preload images on mount according to mode
  useEffect(() => {
    if (isPreGame) {
      RULE_IMAGES.forEach((src) => {
        const im = new Image();
        im.src = src;
      });
    } else if (isInGame) {
      const im = new Image();
      im.src = IN_GAME_RULES;
    }
  }, [isPreGame, isInGame]);

  // Keyboard navigation: only enable arrows in preGame; Esc always closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
      if (!isPreGame) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isPreGame, count]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      {/* Launcher button (image only) */}
      <button
        type="button"
        className="ins-launcher"
        aria-label="Open instructions"
        onClick={() => {
          setIndex(0);
          setOpen(true);
        }}
      >
        <img
          className="ins-launcherImg"
          src={ICON_SRC}
          alt=""
          draggable={false}
        />
      </button>

      {/* Modal */}
      {open && (
        <div
          className="ins-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="How to Play"
          onMouseDown={(e) => {
            // Close only when clicking the backdrop (not the modal content)
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="ins-modal">
            <header className="ins-header">
              <h3 className="ins-title">How to Play</h3>
              {/* Close button (red cross drawn via CSS) */}
              <button
                type="button"
                className="ins-close"
                aria-label="Close"
                onClick={() => setOpen(false)}
              />
            </header>

            <div className="ins-body">
              {/* Stage */}
              <div className="ins-stage">
                {/* Left arrow (only in preGame mode) */}
                {isPreGame && (
                  <button
                    type="button"
                    className="ins-arrow ins-left"
                    aria-label="Previous image"
                    onClick={prev}
                  />
                )}

                <figure className="ins-frame">
                  <img
                    className="ins-image"
                    src={isPreGame ? RULE_IMAGES[index] : IN_GAME_RULES}
                    alt={
                      isPreGame
                        ? `Rule ${index + 1} of ${count}`
                        : "In-game help"
                    }
                    draggable={false}
                  />
                </figure>

                {/* Right arrow (only in preGame mode) */}
                {isPreGame && (
                  <button
                    type="button"
                    className="ins-arrow ins-right"
                    aria-label="Next image"
                    onClick={next}
                  />
                )}
              </div>

              {/* Counter (only in preGame mode) */}
              {isPreGame && (
                <div className="ins-counter">
                  {index + 1} / {count}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
