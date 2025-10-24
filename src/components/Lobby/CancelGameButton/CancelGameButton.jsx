// CancelGameButton.jsx

/**
 * @description Owner-only button that cancels/deletes the current game on the server.
 *
 * @typedef {Object} CancelGameButtonProps
 * @property {boolean} disabled - UI/state guard; prevents triggering when true.
 * @property {string} gameId - Target game id.
 * @property {string} actualPlayerId - Owner/player id used for authorization on the server.
 * @property {() => void} [onCancelGame] - Optional callback fired after a successful cancel.
 *
 * @param {CancelGameButtonProps} props
 */

import "./CancelGameButton.css";

function CancelGameButton({ disabled, gameId, actualPlayerId, onCancelGame }) {
  // Invoke server endpoint to cancel the game; no-op when disabled.
  const handleCancelGame = async () => {
    if (disabled) return;

    try {
      const response = await fetch(
        `http://localhost:8000/games/${gameId}/delete?player_id=${actualPlayerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

      const data = await response.json();
      console.log("Game canceled successfully:", data);

      if (onCancelGame) onCancelGame();
    } catch (error) {
      console.error("Error canceling game:", error);
    }
  };

  return (
    <div>
      <button
        className={`CancelGameButton ${disabled ? "disabled" : ""}`}
        disabled={disabled}
        onClick={handleCancelGame}
      >
        Cancel Game
      </button>
    </div>
  );
}

export default CancelGameButton;
