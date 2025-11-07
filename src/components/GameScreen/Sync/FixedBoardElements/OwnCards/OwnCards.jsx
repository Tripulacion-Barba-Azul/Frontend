// OwnCards.jsx

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
 * @description Private hand row with selection, ordering and a left action area.
 * - Keeps button color in sync with turnStatus (via data-variant).
 * - Customizes Play text based on selected cards' type(s) and custom game rules.
 */

export default function OwnCards({
  cards = [],
  className = "",
  turnStatus = "waiting",
  socialDisgrace = false,
  actionStatus = "blocked",
  players = [],
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [orderedCards, setOrderedCards] = useState(cards);
  const dragStart = useRef(null);

  /* ---------- Keep stable order across updates ---------- */
  useEffect(() => {
    setOrderedCards((prev) => {
      const prevIds = prev.map((c) => c.id);
      const newOnes = cards.filter((c) => !prevIds.includes(c.id));
      const stillPresent = prev.filter((c) => cards.some((n) => n.id === c.id));
      return [...stillPresent, ...newOnes];
    });
  }, [cards]);

  /* ---------- Reset selection when hand or phase changes ---------- */
  useEffect(() => setSelectedIds(new Set()), [cards, turnStatus, actionStatus]); // 👈 incluir actionStatus

  const isDrawingPhase = turnStatus === "drawing";
  const isForcedDiscard =
    socialDisgrace && !isDrawingPhase && !(turnStatus === "waiting");

  const canSelectBase =
    isForcedDiscard ||
    turnStatus === "playing" ||
    turnStatus === "discarding" ||
    turnStatus === "discardingOpt";

  const canSelect = useCallback(
    (card) => {
      if (actionStatus === "unblocked") {
        // solo permiten seleccionar cartas instant
        return String(card?.type ?? "").toLowerCase() === "instant";
      }
      return canSelectBase;
    },
    [actionStatus, canSelectBase]
  );

  /* ---------- Toggle selection (single when forced discard) ---------- */
  const toggleSelect = useCallback(
    (card) => {
      if (!canSelect(card)) return;
      const id = card.id;
      setSelectedIds((prev) => {
        if (isForcedDiscard) {
          if (prev.has(id)) {
            const next = new Set(prev);
            next.delete(id);
            return next;
          }
          return new Set([id]); // single select
        }
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    },
    [canSelect, isForcedDiscard]
  );

  const selectedArray = Array.from(selectedIds);

  const handleReorder = (newOrderIds) => {
    setOrderedCards(
      newOrderIds.map((id) => cards.find((c) => c.id === id)).filter(Boolean)
    );
  };

  /* ---------- Play label logic based on selected card types and rules ---------- */
  const selectedCards = useMemo(
    () =>
      selectedArray
        .map((id) => cards.find((c) => c?.id === id))
        .filter(Boolean),
    [selectedArray, cards]
  );

  const selectedTypes = useMemo(() => {
    const set = new Set(
      selectedCards.map((c) =>
        String(c?.type ?? "")
          .trim()
          .toLowerCase()
      )
    );
    set.delete(""); // ignore empty/equivocal
    return Array.from(set);
  }, [selectedCards]);

  const k = selectedCards.length;
  const hasMixedTypes = selectedTypes.length > 1;
  const isUniformType = selectedTypes.length === 1;
  const t = isUniformType ? selectedTypes[0] : null;

  // Rule helpers
  const containsProhibited = selectedTypes.some(
    (x) => x === "devious" || x === "instant"
  );
  const isEvent = t === "event";
  const isDetective = t === "detective";

  const isInvalidPlay =
    (k > 0 && hasMixedTypes) ||
    containsProhibited ||
    (isUniformType && isEvent && k > 1);

  const playLabel = useMemo(() => {
    if (k === 0) return null; // handled by NoActionButton
    if (isInvalidPlay) return "Invalid play";

    if (isDetective) {
      return k === 1 ? "Add to any set" : "Play detective's set";
    }

    return k === 1 ? `Play ${t}` : `Play ${k} ${t}`;
  }, [k, isInvalidPlay, isDetective, t]);

  /* ---------- Status → color variant ---------- */
  const turnStatusNorm = String(turnStatus || "").toLowerCase();
  const variant =
    actionStatus === "unblocked"
      ? "blue"
      : turnStatusNorm === "takingaction"
      ? "lime"
      : turnStatusNorm === "discarding"
      ? "amber"
      : turnStatusNorm === "discardingopt"
      ? "amber"
      : turnStatusNorm === "drawing"
      ? "red"
      : turnStatusNorm === "playing"
      ? "emerald"
      : "gray";

  return (
    <div className={`owncards-overlay ${className}`} aria-label="cards-row">
      <Reorder.Group
        as="div"
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
                drag="x"
                dragConstraints={{ left: -84, right: 84 }}
                dragElastic={0} // prevent overscroll past the bounds
                dragMomentum={false} // stop drifting after release
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
                      dragStart.current = { x: e.clientX, y: e.clientY };
                    }}
                    onPointerUp={(e) => {
                      if (!dragStart.current) return;
                      const dx = Math.abs(e.clientX - dragStart.current.x);
                      const dy = Math.abs(e.clientY - dragStart.current.y);
                      const moved = Math.sqrt(dx * dx + dy * dy);
                      if (moved < 8) toggleSelect(card);
                      dragStart.current = null;
                    }}
                  />
                </motion.div>
              </Reorder.Item>
            );
          })}
        </AnimatePresence>
      </Reorder.Group>
      {/* Action area — keeps color via data-variant and phase via data-phase */}
      <div
        className="owncards-actions"
        data-variant={variant}
        data-phase={turnStatusNorm}
      >
        {isForcedDiscard ? (
          <DiscardButton
            selectedCards={selectedArray}
            handSize={cards.length}
            requireExactlyOne={true}
            onDiscardSuccess={() => setSelectedIds(new Set())}
          />
        ) : (
          <>
            {(() => {
              // k = selectedArray.length (ya lo tienes más arriba como const k = selectedCards.length)
              // nsfApplicable: actionStatus unblocked y (0 cartas o 1 carta instant)
              const nsfApplicable =
                actionStatus === "unblocked" &&
                (selectedArray.length === 0 ||
                  (selectedArray.length === 1 &&
                    String(selectedCards?.[0]?.type ?? "").toLowerCase() ===
                      "instant"));

              if (nsfApplicable) {
                // Si aplica NSf, mostrar SOLO ese botón
                return (
                  <PlayNsfButton
                    selectedCards={selectedArray}
                    selectedCardsMeta={selectedCards}
                    onPlaySuccess={() => setSelectedIds(new Set())}
                  />
                );
              }

              // Si NSf no aplica, caemos al comportamiento normal
              return (
                <>
                  {turnStatus === "playing" &&
                    (k === 0 ? (
                      <NoActionButton />
                    ) : isInvalidPlay ? (
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
                    ) : // Special-case: exactly one detective card → start "add to set" flow
                    isDetective && k === 1 ? (
                      <AddDetectiveButton
                        selectedCards={selectedArray}
                        selectedCardsMeta={selectedCards}
                        players={players}
                        label={playLabel /* usually "Add to any set" */}
                        onPlaySuccess={() => setSelectedIds(new Set())}
                      />
                    ) : (
                      <PlayCardsButton
                        selectedCards={selectedArray}
                        selectedCardsMeta={selectedCards}
                        label={playLabel}
                        onPlaySuccess={() => setSelectedIds(new Set())}
                      />
                    ))}

                  {(turnStatus === "discarding" ||
                    turnStatus === "discardingOpt") && (
                    <DiscardButton
                      selectedCards={selectedArray}
                      handSize={cards.length}
                      requireAtLeastOne={turnStatus === "discarding"}
                      labelWhenZero={
                        turnStatus === "discardingOpt"
                          ? "Discard nothing"
                          : undefined
                      }
                      onDiscardSuccess={() => setSelectedIds(new Set())}
                    />
                  )}

                  {/* drawing / waiting => show colored but disabled */}
                  {(turnStatusNorm === "drawing" ||
                    turnStatusNorm === "waiting") && (
                    <button
                      type="button"
                      className="owncards-action owncards-action--disabled"
                      disabled
                      aria-disabled="true"
                      data-testid="OwnCardsDisabledAction"
                      title={
                        turnStatusNorm === "drawing" ? "Drawing" : "Waiting"
                      }
                    >
                      {turnStatusNorm === "drawing"
                        ? "Drawing ..."
                        : "Waiting ..."}
                    </button>
                  )}
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
