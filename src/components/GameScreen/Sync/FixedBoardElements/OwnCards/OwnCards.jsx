// OwnCards.jsx
import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useLayoutEffect,
} from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import "./OwnCards.css";
import { CARDS_MAP } from "../../../../../utils/generalMaps";
import DiscardButton from "./DiscardButton/DiscardButton";
import NoActionButton from "./NoActionButton/NoActionButton";
import PlayCardsButton from "./PlayButton/PlayCardsButton.jsx";
import PlayNsfButton from "./PlayNsfButton/PlayNsfButton.jsx";
import AddDetectiveButton from "./AddDetectiveButton/AddDetectiveButton.jsx";

/**
 * @file OwnCards.jsx
 * @description Player hand row with selection, horizontal reordering (X),
 * drag bounds expressed in vw (converted to px), and action area.
 * Fixes included:
 *  - Re-mount Reorder.Group on viewport or card-set change to clear stale transforms.
 *  - Update visual order in useLayoutEffect so it applies before paint.
 *  - Force each item to reset x to 0 after updates (avoid residual offsets).
 */

/* ------------------------------- Constants ------------------------------- */

/** Hardcoded horizontal drag limit in vw (edit to change bounds). */
const VW_DRAG_LIMIT = 4; // ±4vw

/** Pointer movement threshold (px) to distinguish click vs drag. */
const DRAG_CLICK_THRESHOLD_PX = 8;

/** Debounce for resize-driven recalibration (ms). */
const RESIZE_DEBOUNCE_MS = 100;

/* -------------------------------- Utilities ------------------------------- */

/** Convert vw units to px at runtime (visualViewport-aware). */
const vwPx = (vw) => {
  if (typeof window === "undefined") return 0;
  const vwWidth = window.visualViewport?.width ?? window.innerWidth;
  return (vwWidth * vw) / 100;
};

/** Normalize a card type to a lowercased, trimmed string. */
const normType = (t) =>
  String(t ?? "")
    .trim()
    .toLowerCase();

/** Map turn/action status to a color variant for the action area. */
const variantFromStatus = (turnStatus, actionStatus) => {
  const ts = String(turnStatus || "").toLowerCase();
  if (actionStatus === "unblocked") return "blue";
  if (ts === "takingaction") return "lime";
  if (ts === "discarding" || ts === "discardingopt") return "amber";
  if (ts === "drawing") return "red";
  if (ts === "playing") return "emerald";
  return "gray";
};

/* -------------------------------- Component ------------------------------- */

/**
 * @typedef {Object} OwnCardsProps
 * @property {Array<{id:number|string, name:string, type?:string}>} cards
 * @property {string} [className]
 * @property {"waiting"|"drawing"|"playing"|"discarding"|"discardingOpt"|"takingAction"} [turnStatus]
 * @property {boolean} [socialDisgrace]
 * @property {"blocked"|"unblocked"} [actionStatus]
 * @property {Array<any>} [players]
 */

/** @param {OwnCardsProps} props */
export default function OwnCards({
  cards = [],
  className = "",
  turnStatus = "waiting",
  socialDisgrace = false,
  actionStatus = "blocked",
  players = [],
}) {
  /* ------------------------------ Local state ------------------------------ */

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [orderedCards, setOrderedCards] = useState(cards);

  // Force Reorder.Group re-mount on viewport changes (re-measure constraints).
  const [viewportEpoch, setViewportEpoch] = useState(0);

  // Track pointer to differentiate click vs drag.
  const dragStart = useRef(null);

  /* ----------------------- Viewport resize/zoom hook ----------------------- */
  useEffect(() => {
    let t = null;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => setViewportEpoch((k) => k + 1), RESIZE_DEBOUNCE_MS);
    };

    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener?.("resize", onResize);

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener?.("resize", onResize);
    };
  }, []);

  /* -------- Maintain visual order BEFORE paint to avoid layout jumps -------- */
  useLayoutEffect(() => {
    setOrderedCards((prev) => {
      const prevIds = prev.map((c) => c.id);
      const stillPresent = prev.filter((c) => cards.some((n) => n.id === c.id));
      const newOnes = cards.filter((c) => !prevIds.includes(c.id));
      return [...stillPresent, ...newOnes];
    });
  }, [cards]);

  /* ---------------------- Reset selection on phase change ---------------------- */
  useEffect(() => setSelectedIds(new Set()), [cards, turnStatus, actionStatus]);

  /* --------------------------- Phase-derived flags --------------------------- */

  const turnStatusNorm = String(turnStatus || "").toLowerCase();
  const variant = variantFromStatus(turnStatus, actionStatus);

  const isDrawingPhase = turnStatusNorm === "drawing";
  const isForcedDiscard =
    socialDisgrace && !isDrawingPhase && !(turnStatusNorm === "waiting");

  const canSelectBase =
    isForcedDiscard ||
    turnStatusNorm === "playing" ||
    turnStatusNorm === "discarding" ||
    turnStatusNorm === "discardingopt";

  const canSelect = useCallback(
    (card) => {
      if (actionStatus === "unblocked") {
        // Only allow selecting instant cards while "unblocked".
        return normType(card?.type) === "instant";
      }
      return canSelectBase;
    },
    [actionStatus, canSelectBase]
  );

  /* ------------------------------ Selection API ------------------------------ */

  const toggleSelect = useCallback(
    (card) => {
      if (!canSelect(card)) return;
      const id = card.id;

      setSelectedIds((prev) => {
        if (isForcedDiscard) {
          // Forced discard → single choice
          if (prev.has(id)) {
            const next = new Set(prev);
            next.delete(id);
            return next;
          }
          return new Set([id]);
        }
        // Normal toggle (multi-select allowed)
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    },
    [canSelect, isForcedDiscard]
  );

  /* ------------------------------ Reorder handler ------------------------------ */
  const handleReorder = (newOrderIds) => {
    setOrderedCards(
      newOrderIds.map((id) => cards.find((c) => c.id === id)).filter(Boolean)
    );
  };

  /* ----------------------------- Selection metadata ----------------------------- */
  const selectedArray = useMemo(() => Array.from(selectedIds), [selectedIds]);

  const selectedCards = useMemo(
    () =>
      selectedArray
        .map((id) => cards.find((c) => c?.id === id))
        .filter(Boolean),
    [selectedArray, cards]
  );

  const selectedTypes = useMemo(() => {
    const set = new Set(selectedCards.map((c) => normType(c?.type)));
    set.delete("");
    return Array.from(set);
  }, [selectedCards]);

  const k = selectedCards.length;
  const hasMixedTypes = selectedTypes.length > 1;
  const isUniformType = selectedTypes.length === 1;
  const typeUni = isUniformType ? selectedTypes[0] : null;

  const containsProhibited = selectedTypes.some(
    (x) => x === "devious" || x === "instant"
  );
  const isEvent = typeUni === "event";
  const isDetective = typeUni === "detective";

  const isInvalidPlay =
    (k > 0 && hasMixedTypes) ||
    containsProhibited ||
    (isUniformType && isEvent && k > 1);

  const playLabel = useMemo(() => {
    if (k === 0) return null;
    if (isInvalidPlay) return "Invalid play";
    if (isDetective) return k === 1 ? "Add to any set" : "Play detective's set";
    return k === 1 ? `Play ${typeUni}` : `Play ${k} ${typeUni}`;
  }, [k, isInvalidPlay, isDetective, typeUni]);

  /* ---------------------- Build remount key for the group ---------------------- */
  const orderSignature = useMemo(
    () => cards.map((c) => c.id).join("|"),
    [cards]
  );
  const groupKey = `${viewportEpoch}:${orderSignature}`;

  /* ----------------------------------- Render ----------------------------------- */

  return (
    <div className={`owncards-overlay ${className}`} aria-label="cards-row">
      {/* Remount on viewport or card-set changes to clear stale transforms */}
      <Reorder.Group
        key={groupKey}
        layout="position"
        axis="x"
        values={orderedCards.map((c) => c.id)}
        onReorder={handleReorder}
        className="owncards-row"
      >
        <AnimatePresence initial={false}>
          {orderedCards.map((card) => {
            const { id, name } = card;
            const isSelected = selectedIds.has(id);
            const disabledClass = canSelect(card)
              ? ""
              : "owncards-card--disabled";
            const imgSrc = CARDS_MAP[name];

            return (
              <Reorder.Item
                key={id}
                value={id}
                layout="position"
                drag="x"
                // Hardcoded vw bounds (converted to px at render time).
                dragConstraints={{
                  left: -vwPx(VW_DRAG_LIMIT),
                  right: vwPx(VW_DRAG_LIMIT),
                }}
                dragElastic={0}
                dragMomentum={false}
                // Ensure previous drag/layout offsets are cleared
                animate={{ x: 0 }}
                whileDrag={{
                  scale: 1.05,
                  zIndex: 20,
                  filter: "brightness(1.05)",
                }}
                transition={{ type: "spring", stiffness: 600, damping: 28 }}
                style={{ flexShrink: 0 }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.1, ease: "easeOut" }}
                >
                  <img
                    src={imgSrc}
                    alt={`Card ${name}`}
                    className={`owncards-card ${
                      isSelected ? "owncards-card--selected" : ""
                    } ${disabledClass}`}
                    width={140}
                    height="auto"
                    draggable={false}
                    onPointerDown={(e) => {
                      // Record pointer to detect click vs drag.
                      dragStart.current = { x: e.clientX, y: e.clientY };
                    }}
                    onPointerUp={(e) => {
                      // If movement is small, treat as click (toggle selection).
                      if (!dragStart.current) return;
                      const dx = Math.abs(e.clientX - dragStart.current.x);
                      const dy = Math.abs(e.clientY - dragStart.current.y);
                      const moved = Math.hypot(dx, dy);
                      if (moved < DRAG_CLICK_THRESHOLD_PX) toggleSelect(card);
                      dragStart.current = null;
                    }}
                  />
                </motion.div>
              </Reorder.Item>
            );
          })}
        </AnimatePresence>
      </Reorder.Group>

      {/* Action area driven by phase & action status */}
      <div
        className="owncards-actions"
        data-variant={variant}
        data-phase={turnStatusNorm}
      >
        {(() => {
          if (isForcedDiscard) {
            return (
              <DiscardButton
                selectedCards={Array.from(selectedIds)}
                handSize={cards.length}
                requireExactlyOne={true}
                onDiscardSuccess={() => setSelectedIds(new Set())}
              />
            );
          }

          // "Unblocked" → NSf allowed when 0 selected or exactly 1 instant.
          const nsfApplicable =
            actionStatus === "unblocked" &&
            (selectedCards.length === 0 ||
              (selectedCards.length === 1 &&
                normType(selectedCards[0]?.type) === "instant"));

          if (nsfApplicable) {
            return (
              <PlayNsfButton
                selectedCards={Array.from(selectedIds)}
                selectedCardsMeta={selectedCards}
                onPlaySuccess={() => setSelectedIds(new Set())}
              />
            );
          }

          if (turnStatusNorm === "playing") {
            if (selectedCards.length === 0) return <NoActionButton />;

            if (isInvalidPlay) {
              return (
                <button
                  type="button"
                  className="owncards-action owncards-action--invalid"
                  disabled
                  aria-disabled="true"
                  data-testid="OwnCardsInvalidPlay"
                  title="Invalid play"
                >
                  Invalid play
                </button>
              );
            }

            // Special case: single detective → add to any set
            if (isDetective && selectedCards.length === 1) {
              return (
                <AddDetectiveButton
                  selectedCards={Array.from(selectedIds)}
                  selectedCardsMeta={selectedCards}
                  players={players}
                  label={playLabel}
                  onPlaySuccess={() => setSelectedIds(new Set())}
                />
              );
            }

            // Default play
            return (
              <PlayCardsButton
                selectedCards={Array.from(selectedIds)}
                selectedCardsMeta={selectedCards}
                label={playLabel}
                onPlaySuccess={() => setSelectedIds(new Set())}
              />
            );
          }

          if (
            turnStatusNorm === "discarding" ||
            turnStatusNorm === "discardingopt"
          ) {
            return (
              <DiscardButton
                selectedCards={Array.from(selectedIds)}
                handSize={cards.length}
                requireAtLeastOne={turnStatusNorm === "discarding"}
                labelWhenZero={
                  turnStatusNorm === "discardingopt" ? "Discard nothing" : null
                }
                onDiscardSuccess={() => setSelectedIds(new Set())}
              />
            );
          }

          // drawing / waiting → colored but disabled
          return (
            <button
              type="button"
              className="owncards-action owncards-action--disabled"
              disabled
              aria-disabled="true"
              data-testid="OwnCardsDisabledAction"
              title={turnStatusNorm === "drawing" ? "Drawing" : "Waiting"}
            >
              {turnStatusNorm === "drawing"
                ? "Drawing ..."
                : turnStatusNorm === "takingaction"
                ? "Taking action ..."
                : "Waiting ..."}
            </button>
          );
        })()}
      </div>
    </div>
  );
}
