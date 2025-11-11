// StartGameButton.jsx

/**
 * @description Owner-only button that triggers the server-side "start game" action.
 *
 * @typedef {Object} StartGameButtonProps
 * @property {boolean} disabled - UI/state guard; prevents triggering when true.
 * @property {string} gameId - Target game id.
 * @property {string} actualPlayerId - Owner/player id used for authorization on the server.
 * @property {() => void} [onStartGame] - Optional callback fired after a successful start.
 *
 * @param {StartGameButtonProps} props
 */

import "./StartGameButton.css";

function StartGameButton({ disabled, gameId, actualPlayerId, onStartGame }) {
  // Invoke server endpoint to start the game; no-op when disabled.
  const handleStartGame = async () => {
    if (disabled) return;

    try {
      const response = await fetch(
        `http://localhost:8000/games/${gameId}/start?owner_id=${actualPlayerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

      const data = await response.json();
      console.log("Game started successfully:", data);

      if (onStartGame) onStartGame();
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  return (
    <div>
      <button
        className={`StartGameButton ${disabled ? "disabled" : ""}`}
        disabled={disabled}
        onClick={handleStartGame}
      >
        Start Game
      </button>
    </div>
  );
}

export default StartGameButton;
