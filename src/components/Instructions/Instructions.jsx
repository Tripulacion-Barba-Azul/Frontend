// Instructions.jsx

/**
 * @file Instructions.jsx
 * @description Modal instructions/help viewer. In "preGame" mode it shows a paginated
 *              sequence of rule images; in "inGame" mode it shows a single quick-help image.
 *
 * @typedef {Object} InstructionsProps
 * @property {"preGame"|"inGame"} [mode="preGame"] - Presentation mode:
 *   - "preGame": multi-page rules with arrows + counter
 *   - "inGame": single quick-help image (no arrows, no counter)
 */

import { useEffect, useState } from "react";
import "./Instructions.css";

const ICON_SRC = "/Icons/instructionsIcon.png";

// Image sequence used in "preGame" mode
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

// Single quick-help image used in "inGame" mode
const IN_GAME_RULES = "/Rules/00-Rules.png";

/**
 * @param {InstructionsProps} props
 */
export default function Instructions({ mode = "preGame" }) {
  // Modal visibility + current page index
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  // Computed helpers
  const isPreGame = mode === "preGame";
  const isInGame = mode === "inGame";
  const count = RULE_IMAGES.length;

  // Page navigation (wrap-around)
  const next = () => setIndex((i) => (i + 1) % count);
  const prev = () => setIndex((i) => (i - 1 + count) % count);

  // Preload images for smoother UX (per mode)
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

  // Keyboard controls while modal is open:
  // - Esc closes (all modes)
  // - Arrows navigate pages (preGame only)
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

  // Body scroll lock while modal is open
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
      {/* Floating launcher button (icon only) */}
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

      {/* Modal (backdrop + dialog) */}
      {open && (
        <div
          className="ins-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="How to Play"
          onMouseDown={(e) => {
            // Close only if the backdrop (not the content) is clicked
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="ins-modal">
            <header className="ins-header">
              <h3 className="ins-title">How to Play</h3>
              <button
                type="button"
                className="ins-close"
                aria-label="Close"
                onClick={() => setOpen(false)}
              />
            </header>

            <div className="ins-body">
              {/* Stage: image frame + optional arrows */}
              <div className="ins-stage">
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

                {isPreGame && (
                  <button
                    type="button"
                    className="ins-arrow ins-right"
                    aria-label="Next image"
                    onClick={next}
                  />
                )}
              </div>

              {/* Page counter (preGame only) */}
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
