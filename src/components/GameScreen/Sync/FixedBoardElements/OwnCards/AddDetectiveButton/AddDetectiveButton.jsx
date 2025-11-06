// AddDetectiveButton.jsx
import React, { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
import SelectPlayer from "../../../../Events/Actions/SelectPlayer/SelectPlayer.jsx";
import SelectSet from "../../../../Events/Actions/SelectSet/SelectSet.jsx";

/** Render children into <body> to avoid stacking issues */
function BodyPortal({ children }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

const norm = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase();
const isName = (card, target) => norm(card?.name) === norm(target);

export default function AddDetectiveButton({
  selectedCards = [],
  selectedCardsMeta = [],
  players = [],
  onPlaySuccess,
  label = "Add to any set",
}) {
  const [searchParams] = useSearchParams();
  const { gameId } = useParams();
  const playerId = Number(searchParams.get("playerId"));

  const [step, setStep] = useState("idle"); // "idle" | "selectPlayer" | "selectSet" | "posting"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [chosenPlayerId, setChosenPlayerId] = useState(null);
  const [chosenSetId, setChosenSetId] = useState(null);

  // Prefiltered universe (players with at least one valid set, and their valid sets)
  const [filteredPlayers, setFilteredPlayers] = useState(players);
  const [validSetsByPlayer, setValidSetsByPlayer] = useState({}); // { [playerId]: DetectiveSet[] }

  // === Selection meta of the single card chosen ===
  const selectionMeta = useMemo(() => {
    const k = selectedCards?.length ?? 0;
    const onlyMeta = k === 1 ? selectedCardsMeta?.[0] ?? null : null;
    return { k, onlyMeta };
  }, [selectedCards, selectedCardsMeta]);

  const canStartFlow = useMemo(() => {
    const { k, onlyMeta } = selectionMeta;
    if (k !== 1) return false;
    if (norm(onlyMeta?.type) !== "detective") return false;
    if (isName(onlyMeta, "Harley Quin")) return false; // business rule
    return true;
  }, [selectionMeta]);

  const endpointTemplate =
    "http://localhost:8000/play/{id}/actions/add-detective-to-set";

  // === VALIDATION RULES (set, card) ===
  // - If set contains a card with the SAME name as card -> valid
  // - If set contains "Tommy Beresford" and card is "Tuppence Beresford" -> valid
  // - If set contains "Tuppence Beresford" and card is "Tommy Beresford" -> valid
  // - If card is "Ariadne Oliver" -> valid for ANY set
  function validateSetForCard(set, card) {
    const cName = norm(card?.name);
    if (!cName) return false;

    // Ariadne Oliver can be added to any set
    if (cName === "ariadne oliver") return true;

    const namesInSet = (set?.cards ?? []).map((c) => norm(c?.name));

    // Same-name rule
    if (namesInSet.includes(cName)) return true;

    // Beresfords pairing rules
    const hasTommy = namesInSet.includes("tommy beresford");
    const hasTuppence = namesInSet.includes("tuppence beresford");

    if (hasTommy && cName === "tuppence beresford") return true;
    if (hasTuppence && cName === "tommy beresford") return true;

    return false;
  }

  // Build filtered players + valid sets map for the chosen card
  const buildValidUniverse = (cardMeta) => {
    const map = {};
    const playersWithValid = [];
    let totalValid = 0;

    for (const p of players) {
      const validSets = (p.sets ?? []).filter((s) => {
        try {
          return !!validateSetForCard(s, cardMeta);
        } catch {
          return false;
        }
      });

      if (validSets.length > 0) {
        playersWithValid.push({ ...p, sets: validSets });
        map[p.id] = validSets;
        totalValid += validSets.length;
      }
    }
    return { totalValid, playersWithValid, map };
  };

  const openFlow = () => {
    const { onlyMeta } = selectionMeta;

    if (!canStartFlow) {
      setError(
        isName(onlyMeta, "Harley Quin")
          ? `Can't add "Harley Quin" to an existing set`
          : `Can't add this card to a set`
      );
      return;
    }

    // Prefilter with our internal validate rules
    const { totalValid, playersWithValid, map } = buildValidUniverse(onlyMeta);

    if (totalValid === 0) {
      setError("There are no valid sets to add this card to");
      return;
    }

    setFilteredPlayers(playersWithValid);
    setValidSetsByPlayer(map);

    setError("");
    setChosenPlayerId(null);
    setChosenSetId(null);
    setStep("selectPlayer");
  };

  const handlePlayerChosen = (id) => {
    setChosenPlayerId(id);
    setChosenSetId(null);
    setStep("selectSet");
  };

  const handlePlayerGoBack = () => {
    // Back to board to pick another card
    setChosenPlayerId(null);
    setChosenSetId(null);
    setError("");
    setStep("idle");
  };

  const setsOfChosenPlayer = useMemo(() => {
    if (chosenPlayerId == null) return [];
    return validSetsByPlayer[chosenPlayerId] ?? [];
  }, [validSetsByPlayer, chosenPlayerId]);

  // Pass setId to submit to avoid waiting for async state commit
  const handleSetChosen = (setId) => {
    setChosenSetId(setId);
    void submit({ setIdOverride: setId });
  };

  /**
   * Submit the action. Passing setIdOverride avoids relying on not-yet-committed state.
   * On failure, we close the modal (step -> idle) so error text is visible under the button.
   */
  async function submit({ setIdOverride } = {}) {
    setError("");
    if (loading) return;

    const { k, onlyMeta } = selectionMeta;
    if (k !== 1) {
      setError("You must select exactly one detective card");
      setStep("idle");
      return;
    }
    if (norm(onlyMeta?.type) !== "detective") {
      setError("Selected card must be of type detective");
      setStep("idle");
      return;
    }
    if (isName(onlyMeta, "Harley Quin")) {
      setError(`Can't add "Harley Quin" to an existing set`);
      setStep("idle");
      return;
    }
    if (chosenPlayerId == null) {
      setError("Choose a player first");
      setStep("idle");
      return;
    }

    const effectiveSetId =
      typeof setIdOverride === "number" ? setIdOverride : chosenSetId;

    if (effectiveSetId == null) {
      setError("Choose a set");
      setStep("idle");
      return;
    }

    const cardId = Number(selectedCards[0]);
    const url = endpointTemplate.replace("{id}", String(gameId ?? "0"));
    const body = { playerId, cardId, setId: Number(effectiveSetId) };

    setLoading(true);
    setStep("posting");

    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        console.log("AddDetectiveButton: POST failed", body, resp);
        throw new Error(`POST failed with status ${resp.status}`);
      }

      onPlaySuccess?.(); // clear selection upstream
      setStep("idle");
    } catch (e) {
      console.error(e);
      setError("Failed to add detective to set");
      setStep("idle"); // close modal so the error appears under the button
      onPlaySuccess?.(); // parity with other flows that clear selection on handled error
    } finally {
      setLoading(false);
    }
  }

  const buttonText = loading || step === "posting" ? "Sending..." : label;

  return (
    <div>
      <button
        className="owncards-action"
        onClick={openFlow}
        disabled={loading} // keep enabled to show invalid-selection errors
        title="Add this detective to a set"
      >
        {buttonText}
      </button>

      {/* Error text under the play button */}
      {error && (
        <div role="alert" style={{ color: "#f4e1a3", fontSize: "12px" }}>
          {error}
        </div>
      )}

      {/* Modals via body portal */}
      {step === "selectPlayer" && (
        <BodyPortal>
          <SelectPlayer
            actualPlayerId={playerId}
            players={filteredPlayers /* players with at least one valid set */}
            selectedPlayerId={handlePlayerChosen}
            goBack={handlePlayerGoBack}
            text={"Select one player to add this detective to their set"}
          />
        </BodyPortal>
      )}

      {step === "selectSet" && (
        <BodyPortal>
          <SelectSet
            actualPlayerId={playerId}
            sets={setsOfChosenPlayer /* only valid sets for chosen player */}
            selectedSetId={handleSetChosen}
            goBack={() => setStep("selectPlayer")}
            text={"Select one set to add this detective to"}
          />
        </BodyPortal>
      )}
    </div>
  );
}
