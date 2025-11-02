import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Clock.css";

/**
 * Bottom-fixed clock image that listens to websocket "timer" events.
 * Props:
 *  - websocket: WebSocket-like (expects addEventListener("message", ...))
 *  - turnStatus: "waiting"|"playing"|"discarding"|"discardingOpt"|"drawing"
 */
export default function Clock({ websocket, turnStatus = "waiting" }) {
  const [eventTime, setEventTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [received, setReceived] = useState(false);

  // finish hold (1s) — state + refs to avoid stale closures
  const FINISH_HOLD_MS = 2000;
  const [finishHoldActive, setFinishHoldActive] = useState(false);
  const finishHoldActiveRef = useRef(false);
  const finishTimerRef = useRef(null);
  const finishExpiryRef = useRef(0);
  
  // Flag to prevent re-triggering the hold for the same "finish" event
  const [holdCompleted, setHoldCompleted] = useState(false);
  const holdCompletedRef = useRef(false);

  // helper to set both state and ref for hold active
  const setFinishHold = (v) => {
    finishHoldActiveRef.current = v;
    setFinishHoldActive(v);
  };

  // helper to set both state and ref for hold completed
  const setHoldCompletedFlag = (v) => {
    holdCompletedRef.current = v;
    setHoldCompleted(v);
  };

  // start the finish hold only if not already active AND not already completed for this cycle
  const startFinishHold = () => {
    if (finishHoldActiveRef.current || holdCompletedRef.current) return;
    
    setFinishHold(true);
    finishExpiryRef.current = Date.now() + FINISH_HOLD_MS;
    
    // clear any existing timer for safety
    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
    
    finishTimerRef.current = setTimeout(() => {
      finishTimerRef.current = null;
      finishExpiryRef.current = 0;
      setFinishHold(false);
      setHoldCompletedFlag(true); // Mark as completed
    }, FINISH_HOLD_MS);
  };

  // cancel the hold immediately (clear timeout & flags)
  const cancelFinishHold = () => {
    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
    finishExpiryRef.current = 0;
    setFinishHold(false);
  };

  // WS listener
  useEffect(() => {
    if (!websocket) return;

    const handleMessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.event !== "timer" || !data.payload) return;
        const eTi = Number(data.payload.eventTime) || 0;
        const tLi = Number(data.payload.timeLeft) || 0;

        setReceived(true);
        setEventTime(eTi);
        setTimeLeft(tLi);

        if (tLi === 0) {
          // start hold if not active and not completed yet
          startFinishHold();
        } else {
          // tLi > 0: reset the hold completed flag (new cycle started)
          setHoldCompletedFlag(false);
          
          // if a hold was active but already expired, clear it
          if (finishHoldActiveRef.current) {
            const now = Date.now();
            if (finishExpiryRef.current && now >= finishExpiryRef.current) {
              cancelFinishHold();
            }
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    websocket.addEventListener("message", handleMessage);
    return () => {
      websocket.removeEventListener("message", handleMessage);
      if (finishTimerRef.current) {
        clearTimeout(finishTimerRef.current);
        finishTimerRef.current = null;
      }
    };
  }, [websocket]);

  // show only if not waiting, except while finish hold active
  const shouldShowClock = !(turnStatus === "waiting" && !finishHoldActive);

  // derive image purely from state/refs (no side-effects)
  const imageName = useMemo(() => {
    if (!received) return "CLOCK_0";
    if (finishHoldActive) return "CLOCK_8";
    
    // After hold completed, if still at 0, don't show CLOCK_8
    if (timeLeft <= 0) {
      if (holdCompleted) return "CLOCK_0"; // or return null to hide
      return "CLOCK_8";
    }

    // Special images for last 3 seconds
    if (timeLeft <= 3 && timeLeft > 2) return "CLOCK_S3";
    if (timeLeft <= 2 && timeLeft > 1) return "CLOCK_S2";
    if (timeLeft <= 1 && timeLeft > 0) return "CLOCK_S1";

    // For the rest: calculate eighths based on (total - 3) seconds
    const total = eventTime > 0 ? eventTime : 8;
    const adjustedTotal = Math.max(1, total - 3); // tiempo sin los últimos 3 seg
    const elapsed = Math.max(0, total - timeLeft);
    const eighthDuration = adjustedTotal / 8;
    const raw = eighthDuration > 0 ? Math.floor(elapsed / eighthDuration) : 0;
    const idx = Math.min(7, Math.max(0, raw));
    return `CLOCK_${idx}`;
  }, [received, eventTime, timeLeft, finishHoldActive, holdCompleted]);

  if (!shouldShowClock) return null;

  const imgSrc = `/Clock/${imageName}.png`;
  const isLast3 = imageName.startsWith("CLOCK_S");
  const isFinish = imageName === "CLOCK_8" && finishHoldActive;
  const shake = isLast3 ? 6 : 3;

  const animateProps = {
    opacity: 1,
    scale: 1,
    x: [0, -shake, shake, 0],
    rotate: [0, -shake * 0.12, shake * 0.12, 0],
  };

  const transitionProps = {
    opacity: { duration: 0.14, ease: "easeOut" },
    scale: { duration: 0.14 },
    x: isFinish
      ? { duration: 0.18, ease: "easeInOut", repeat: Infinity, repeatType: "loop" }
      : { duration: 0.22, ease: "easeInOut", times: [0, 0.25, 0.75, 1] },
    rotate: isFinish
      ? { duration: 0.18, repeat: Infinity, repeatType: "loop" }
      : { duration: 0.22, times: [0, 0.25, 0.75, 1] },
  };

  return (
    <motion.div 
      className="clock-root" 
      aria-hidden="true"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="clock-img-area">
        <AnimatePresence mode="sync" initial={false}>
          <motion.img
            key={imageName}
            src={imgSrc}
            alt={`Clock ${imageName}`}
            className="clock-image"
            draggable={false}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={animateProps}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={transitionProps}
            style={{ position: "absolute" }}
          />
        </AnimatePresence>
      </div>
    </motion.div>
  );
}