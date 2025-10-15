import { useEffect, useMemo, useState, useCallback } from "react";
import SelectPlayer from "../SelectPlayer/SelectPlayer";
import SelectSet from "../SelectSet/SelectSet";
import SelectSecret from "../SelectSecret/SelectSecret";
import SelectDiscardPileCards from "../SelectDiscardPileCards/SelectDiscardPileCards";

export default function EffectManager({
  publicData,
  privateData,
  actualPlayerId,
  wsRef,
}) {
  // Current event and step of the flow
  const [currentEvent, setCurrentEvent] = useState(null); // string | null
  const [payload, setPayload] = useState(null);
  const [step, setStep] = useState(null); // null | 'selectPlayer' | 'selectPlayer2' | 'selectSecret' | 'selectSet' | 'selectDiscard'

  // User selections (kept minimal, no error handling)
  const [selPlayer1, setSelPlayer1] = useState(null);
  const [selPlayer2, setSelPlayer2] = useState(null);
  const [selSecret, setSelSecret] = useState(null);
  const [selSet, setSelSet] = useState(null);
  const [selCard, setSelCard] = useState(null);

  // Back navigation flag (children can request going one step back)
  const [backRequested, setBackRequested] = useState(false);

  // Back navigation request handler
  const requestBack = useCallback(() => setBackRequested(true), []);

  // Small reset helper to clear the flow state
  const resetFlow = () => {
    setCurrentEvent(null);
    setStep(null);
    setSelPlayer1(null);
    setSelPlayer2(null);
    setSelSecret(null);
    setSelSet(null);
    setSelCard(null);
    setPayload(null);
    setBackRequested(false);
  };

  // Post the effect response to your backend (as requested)
  const sendEffectResponse = async (responsePayload) => {
    try {
      const response = await fetch(`/effectResponse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responsePayload }),
      });
      if (!response.ok) {
        throw new Error(
          `Effect response failed with status ${response.status}`
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      resetFlow();
    }
  };

  // Listen to server messages: start flows per incoming event
  useEffect(() => {
    if (!wsRef) return;
    wsRef.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      // Reset all selections for a new flow
      setSelPlayer1(null);
      setSelPlayer2(null);
      setSelSecret(null);
      setSelSet(null);
      setSelCard(null);
      setPayload(data.payload ?? null);
      setBackRequested(false);

      // Initialize step based on event type
      switch (data.event) {
        case "selectAnyPlayer":
          setCurrentEvent("selectAnyPlayer");
          setStep("selectPlayer");
          break;

        case "andThenThereWasOneMore":
          setCurrentEvent("andThenThereWasOneMore");
          setStep("selectPlayer");
          break;

        case "satterthwaiteWild":
          setCurrentEvent("satterthwaiteWild");
          setStep("selectPlayer");
          break;

        case "revealSecret":
          setCurrentEvent("revealSecret");
          setStep("selectPlayer");
          break;

        case "revealOwnSecret":
          setCurrentEvent("revealOwnSecret");
          setStep("selectSecret");
          break;

        case "hideSecret":
          setCurrentEvent("hideSecret");
          setStep("selectPlayer");
          break;

        case "stealSet":
          setCurrentEvent("stealSet");
          setStep("selectPlayer");
          break;

        case "lookIntoTheAshes":
          setCurrentEvent("lookIntoTheAshes");
          setStep("selectDiscard");
          break;

        default:
          setCurrentEvent(null);
          setStep(null);
      }
    };
  }, [wsRef]);

  // ===== Derived data =====
  const playersAll = publicData?.players ?? [];

  const playersExceptMe = useMemo(
    () => playersAll.filter((p) => String(p.id) !== String(actualPlayerId)),
    [playersAll, actualPlayerId]
  );

  const selectedPlayer1Obj = useMemo(
    () => playersAll.find((p) => String(p.id) === String(selPlayer1)) ?? null,
    [playersAll, selPlayer1]
  );

  const setsOfPlayer1 = useMemo(
    () => selectedPlayer1Obj?.sets ?? [],
    [selectedPlayer1Obj]
  );

  // Resolve hidden / revealed secrets depending on target and ownership
  const secretsOfTarget = useMemo(() => {
    if (!selPlayer1) return [];
    const isMe = String(selPlayer1) === String(actualPlayerId);
    if (isMe) return privateData?.secrets ?? [];
    const target = playersAll.find((p) => String(p.id) === String(selPlayer1));
    return target?.secrets ?? [];
  }, [selPlayer1, actualPlayerId, privateData, playersAll]);

  const ownSecrets = useMemo(() => privateData?.secrets ?? [], [privateData]);

  const discardTopFive = useMemo(() => payload?.cards ?? [], [payload]);

  // ===== Step advancement / back navigation / finish logic per event =====
  useEffect(() => {
    if (!currentEvent) return;

    // --- Back navigation handling (child requested goBack) ---
    if (backRequested) {
      // From selectSet -> back to selectPlayer (stealSet)
      if (step === "selectSet" && currentEvent === "stealSet") {
        setSelSet(null); // clear current step selection
        setSelPlayer1(null); // clear the trigger of forward from "selectPlayer"
        setBackRequested(false);
        setStep("selectPlayer");
        return;
      }

      // From selectSecret -> back to selectPlayer
      if (
        step === "selectSecret" &&
        (currentEvent === "revealSecret" ||
          currentEvent === "satterthwaiteWild" ||
          currentEvent === "andThenThereWasOneMore" ||
          currentEvent === "hideSecret")
      ) {
        setSelSecret(null); // clear current step selection
        setSelPlayer1(null); // prevent auto-forward from "selectPlayer"
        setBackRequested(false);
        setStep("selectPlayer");
        return;
      }

      // From selectPlayer2 -> back to selectSecret (andThenThereWasOneMore)
      if (
        step === "selectPlayer2" &&
        currentEvent === "andThenThereWasOneMore"
      ) {
        setSelPlayer2(null); // clear current step selection
        setSelSecret(null); // prevent auto-forward from "selectSecret"
        setBackRequested(false);
        setStep("selectSecret");
        return;
      }

      // From selectSecret in revealOwnSecret: nothing to go back to
      if (step === "selectSecret" && currentEvent === "revealOwnSecret") {
        setBackRequested(false);
        return;
      }

      // Fallback
      setBackRequested(false);
    }

    // --- Forward progression / finish (unchanged semantics) ---
    switch (currentEvent) {
      case "selectAnyPlayer": {
        if (step === "selectPlayer" && selPlayer1 != null) {
          sendEffectResponse({
            event: "selectAnyPlayer",
            playerId: actualPlayerId,
            response: { selectedPlayerId: selPlayer1 },
          });
        }
        break;
      }

      case "andThenThereWasOneMore": {
        if (step === "selectPlayer" && selPlayer1 != null) {
          setStep("selectSecret");
        } else if (step === "selectSecret" && selSecret != null) {
          setStep("selectPlayer2");
        } else if (step === "selectPlayer2" && selPlayer2 != null) {
          sendEffectResponse({
            event: "andThenThereWasOneMore",
            playerId: actualPlayerId,
            response: {
              secretId: selSecret,
              selectedPlayerId: selPlayer1, // the player we stole from
              stolenPlayerId: selPlayer2, // the player we give the hidden secret to
            },
          });
        }
        break;
      }

      case "satterthwaiteWild": {
        if (step === "selectPlayer" && selPlayer1 != null) {
          setStep("selectSecret");
        } else if (step === "selectSecret" && selSecret != null) {
          sendEffectResponse({
            event: "satterthwaiteWild",
            playerId: actualPlayerId,
            response: {
              secretId: selSecret,
              stolenPlayerId: selPlayer1,
            },
          });
        }
        break;
      }

      case "revealSecret": {
        if (step === "selectPlayer" && selPlayer1 != null) {
          setStep("selectSecret");
        } else if (step === "selectSecret" && selSecret != null) {
          sendEffectResponse({
            event: "revealSecret",
            playerId: actualPlayerId,
            response: {
              secretId: selSecret,
              revealedPlayerId: selPlayer1,
            },
          });
        }
        break;
      }

      case "revealOwnSecret": {
        if (step === "selectSecret" && selSecret != null) {
          sendEffectResponse({
            event: "revealOwnSecret",
            playerId: actualPlayerId,
            response: { secretId: selSecret },
          });
        }
        break;
      }

      case "hideSecret": {
        if (step === "selectPlayer" && selPlayer1 != null) {
          setStep("selectSecret");
        } else if (step === "selectSecret" && selSecret != null) {
          sendEffectResponse({
            event: "hideSecret",
            playerId: actualPlayerId,
            response: {
              secretId: selSecret,
              hiddenPlayerId: selPlayer1,
            },
          });
        }
        break;
      }

      case "stealSet": {
        if (step === "selectPlayer" && selPlayer1 != null) {
          setStep("selectSet");
        } else if (step === "selectSet" && selSet != null) {
          sendEffectResponse({
            event: "stealSet",
            playerId: actualPlayerId,
            response: {
              setId: selSet,
              stolenPlayerId: selPlayer1,
            },
          });
        }
        break;
      }

      case "lookIntoTheAshes": {
        if (step === "selectDiscard" && selCard != null) {
          sendEffectResponse({
            event: "lookIntoTheAshes",
            playerId: actualPlayerId,
            response: { cardId: selCard },
          });
        }
        break;
      }

      default:
        break;
    }
  }, [
    currentEvent,
    step,
    selPlayer1,
    selPlayer2,
    selSecret,
    selSet,
    selCard,
    backRequested,
    actualPlayerId,
  ]);

  // ===== Prompt text per step (simple guidance) =====
  const promptText = useMemo(() => {
    switch (currentEvent) {
      case "selectAnyPlayer":
        return "Select any player to discard all their NotSoFast cards";
      case "andThenThereWasOneMore":
        if (step === "selectPlayer")
          return "Select one player to steal a secret from";
        if (step === "selectSecret")
          return "Select one revealed secret to steal";
        if (step === "selectPlayer2")
          return "Select one player to give the secret hidden to";
        return "";
      case "satterthwaiteWild":
        if (step === "selectPlayer")
          return "Select one player to steal a secret from";
        if (step === "selectSecret") return "Select one hidden secret to steal";
        return "";
      case "revealSecret":
        if (step === "selectPlayer")
          return "Select one player to reveal a secret from";
        if (step === "selectSecret")
          return "Select one hidden secret to reveal";
        return "";
      case "revealOwnSecret":
        return "Select one of your hidden secrets to reveal";
      case "hideSecret":
        if (step === "selectPlayer")
          return "Select one player to hide a secret from";
        if (step === "selectSecret")
          return "Select one revealed secret to hide";
        return "";
      case "stealSet":
        if (step === "selectPlayer")
          return "Select one player to steal a set from";
        if (step === "selectSet") return "Select one set to steal";
        return "";
      case "lookIntoTheAshes":
        return "Select one card to steal from the top five cards of the discard pile";
      default:
        return "";
    }
  }, [currentEvent, step]);

  // ===== Collections to feed into each step's UI =====
  const playersForThisStep = useMemo(() => {
    switch (currentEvent) {
      case "stealSet":
        return playersExceptMe; // cannot target yourself
      case "selectAnyPlayer":
      case "andThenThereWasOneMore":
      case "satterthwaiteWild":
      case "revealSecret":
      case "hideSecret":
        return playersAll;
      default:
        return [];
    }
  }, [currentEvent, playersAll, playersExceptMe]);

  const revealedForThisStep = useMemo(() => {
    switch (currentEvent) {
      case "andThenThereWasOneMore": // needs revealed secret
      case "hideSecret": // needs revealed secret
        return true;
      case "satterthwaiteWild": // needs hidden secret
      case "revealSecret": // needs hidden secret
      case "revealOwnSecret": // needs hidden secret
        return false;
      default:
        return undefined; // not used in other steps
    }
  }, [currentEvent]);

  const secretsForThisStep = useMemo(() => {
    switch (currentEvent) {
      case "andThenThereWasOneMore":
        return secretsOfTarget;
      case "satterthwaiteWild":
      case "revealSecret":
        return secretsOfTarget;
      case "revealOwnSecret":
        return ownSecrets;
      case "hideSecret":
        return secretsOfTarget;
      default:
        return [];
    }
  }, [currentEvent, secretsOfTarget, ownSecrets]);

  const setsForThisStep = setsOfPlayer1;
  const discardForThisStep = discardTopFive;

  // ===== Render children (no overlay wrapper as per your change) =====
  return (
    <>
      {step === "selectPlayer" && (
        <SelectPlayer
          actualPlayerId={actualPlayerId}
          players={playersForThisStep}
          selectedPlayerId={setSelPlayer1} // child must call with chosen id
          text={promptText}
        />
      )}

      {step === "selectPlayer2" && (
        <SelectPlayer
          actualPlayerId={actualPlayerId}
          players={playersAll}
          selectedPlayerId={setSelPlayer2} // child must call with chosen id
          text={promptText}
        />
      )}

      {step === "selectSecret" && (
        <SelectSecret
          actualPlayerId={actualPlayerId}
          secrets={secretsForThisStep}
          playerId={selPlayer1 ?? actualPlayerId}
          revealed={revealedForThisStep}
          selectedSecretId={setSelSecret}
          goBack={currentEvent === "revealOwnSecret" ? null : requestBack}
          text={promptText}
        />
      )}

      {step === "selectSet" && (
        <SelectSet
          actualPlayerId={actualPlayerId}
          sets={setsForThisStep}
          selectedSetId={setSelSet} // child must call with chosen id
          goBack={requestBack} // child may call goBack(true) to go back one step
          text={promptText}
        />
      )}

      {step === "selectDiscard" && (
        <SelectDiscardPileCards
          cards={discardForThisStep}
          selectedCardId={setSelCard} // child must call with chosen id
          text={promptText}
        />
      )}
    </>
  );
}
