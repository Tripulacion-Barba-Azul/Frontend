// BackgroundMusicPlayer.jsx

/**
 * @file BackgroundMusicPlayer.jsx
 * @description Looping background audio with a floating mute/unmute control.
 *
 * @typedef {Object} BackgroundMusicPlayerProps
 * @property {string} [src="/audio/bgm.mp3"] - Default audio source (used if `sources` is not provided).
 * @property {string[]} [sources] - Optional prioritized list of sources (e.g., [".../bgm.mp3",".../bgm.ogg"]).
 * @property {number} [volume=0.4] - Initial volume in [0..1]. (Runtime clamped)
 * @property {string} [persistKey="bgm-muted"] - LocalStorage key to persist mute state across sessions.
 * @property {string} [className=""] - Extra class names for the root.
 * @property {boolean} [showControl=true] - When false, hides the floating control (audio still plays).
 *
 * Behavior:
 * - Starts muted by default to avoid autoplay restrictions; first gesture resumes playback.
 * - Uses `volume` + `muted` UI state (not `audio.muted`) to improve cross-platform behavior.
 * - Persists mute state in localStorage under `persistKey`.
 */

import React, { useEffect, useRef, useState } from "react";
import "./BackgroundMusicPlayer.css";

/**
 * BackgroundMusicPlayer
 * - Looped background audio with a floating mute/unmute icon (PNG only, no button chrome).
 * - Fixed icon size (hardcoded), hover scale + soft white glow.
 */
export default function BackgroundMusicPlayer({
  src = "/audio/bgm.mp3",
  sources,
  volume = 0.4,
  persistKey = "bgm-muted",
  className = "",
  showControl = true,
}) {
  // Icons (PNG)
  const iconOn = "/Icons/musicOnIcon.png";
  const iconMuted = "/Icons/musicMutedIcon.png";

  // State & refs
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(() => {
    try {
      const saved = localStorage.getItem(persistKey);
      return saved ? saved === "true" : true; // start muted to avoid autoplay issues
    } catch {
      return true;
    }
  });

  // ---- audio lifecycle -----------------------------------------------------
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    a.loop = true;
    a.muted = false; // control via volume to avoid iOS quirks
    a.volume = muted ? 0 : clamp01(volume);

    const tryPlay = () => {
      a.play().catch(() => {
        // Autoplay blocked -> keep muted until first gesture or manual unmute
        if (!muted) {
          a.volume = 0;
          setMuted(true);
        }
      });
    };
    tryPlay();

    // Resume on first user gesture (helps with autoplay policies)
    const resumeOnGesture = () => {
      a.play().catch(() => {});
      document.removeEventListener("pointerdown", resumeOnGesture);
      document.removeEventListener("keydown", resumeOnGesture);
    };
    document.addEventListener("pointerdown", resumeOnGesture, { once: true });
    document.addEventListener("keydown", resumeOnGesture, { once: true });

    return () => {
      document.removeEventListener("pointerdown", resumeOnGesture);
      document.removeEventListener("keydown", resumeOnGesture);
      a.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist and apply volume when muting/unmuting or when 'volume' prop changes
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = muted ? 0 : clamp01(volume);
    try {
      localStorage.setItem(persistKey, String(muted));
    } catch {
      /* noop */
    }
  }, [muted, volume, persistKey]);
  // -------------------------------------------------------------------------

  const toggle = () => setMuted((m) => !m);

  // Fixed icon size (hardcoded in CSS)
  return (
    <div aria-live="off" className={`bmp-root ${className}`}>
      <audio ref={audioRef} preload="auto" playsInline>
        {(Array.isArray(sources) && sources.length ? sources : [src]).map(
          (s, i) => {
            const ext = (s.split(".").pop() || "").toLowerCase();
            const type =
              ext === "mp3"
                ? "audio/mpeg"
                : ext === "ogg"
                ? "audio/ogg"
                : undefined;
            return <source key={i} src={s} type={type} />;
          }
        )}
        Your browser does not support the audio element.
      </audio>

      {showControl && (
        <button
          type="button"
          onClick={toggle}
          className="bmp-btn"
          aria-label={
            muted ? "Unmute background music" : "Mute background music"
          }
          title={muted ? "Unmute" : "Mute"}
        >
          <img
            src={muted ? iconMuted : iconOn}
            alt={muted ? "Sound off" : "Sound on"}
            className="bmp-icon"
            draggable={false}
          />
        </button>
      )}
    </div>
  );
}

function clamp01(n) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
