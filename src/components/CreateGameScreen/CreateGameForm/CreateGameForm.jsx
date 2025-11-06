// CreateGameForm.jsx

/**
 * @file CreateGameForm.jsx
 * @description Form to create a new game and register the host (owner) as the first player.
 * Validates game constraints (min/max players) and basic player info, then POSTs to the API.
 * On success, redirects to "/game/:gameId?playerId=:ownerId".
 *
 * Props: none (this component does not accept props).
 *
 * UX flow:
 * 1) User fills "Game Settings" (name, min, max) and "Your Information" (name, birthday, avatar).
 * 2) Client-side validation runs on submit (range checks, consistency between min/max, etc.).
 * 3) POST → /games with a payload containing { player_info, game_info }.
 * 4) On success, navigate to the game screen with query param for the owner’s id.
 *
 * API request shape:
 * {
 *   "player_info": {
 *     "playerName": string,
 *     "birthDate": "YYYY-MM-DD",
 *     "avatar": number | undefined
 *   },
 *   "game_info": {
 *     "gameName": string,
 *     "minPlayers": number,
 *     "maxPlayers": number
 *   }
 * }
 *
 * API success response (subset used here):
 * {
 *   "gameId": string|number,
 *   "ownerId": string
 * }
 */

/**
 * @typedef {Object} CreateGameSettings
 * @property {string} GameName - Displayed to all players (<= 20 chars).
 * @property {string} MinPlayers - Numeric string in [2..6]; converted to number on submit.
 * @property {string} MaxPlayers - Numeric string in [2..6]; converted to number on submit.
 * @property {string} PlayerName - Owner’s display name (<= 20 chars).
 * @property {string} PlayerBirthday - ISO date (YYYY-MM-DD); not in the future.
 * @property {string} Avatar - Avatar id as string; mapped via AVATAR_MAP.
 */

/**
 * @typedef {Partial<Record<keyof CreateGameSettings, string>>} CreateGameErrors
 * Keys present only when the corresponding field has a validation error.
 */

import "./CreateGameForm.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AvatarPicker from "../../JoinGameScreen/AvatarPicker/AvatarPicker";
import { AVATAR_MAP } from "../../../utils/generalMaps";

export default function CreateGameForm() {
  /**
   * Local form state for both game and player sections.
   * Note: numeric inputs are stored as strings to keep the inputs controlled and simple.
   * Convert to numbers only when building the API payload.
   * @type {[CreateGameSettings, (s: CreateGameSettings) => void]}
   */
  const [settings, setSettings] = useState({
    GameName: "defaultGame",
    MinPlayers: "2",
    MaxPlayers: "6",
    IsPrivate: false,
    Password: "",
    PlayerName: "defaultName",
    PlayerBirthday: "1990-01-01",
    Avatar: "1",
  });

  /** @type {[CreateGameErrors, (e: CreateGameErrors) => void]} */
  const [formErrors, setFormErrors] = useState({});
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Submission lock to avoid duplicate POSTs on double click or sluggish networks.
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  /**
   * Synchronous validation. Keep logic aligned with server rules to avoid UX mismatches.
   * @param {CreateGameSettings} values
   * @returns {CreateGameErrors}
   */
  const validate = (values) => {
    const errors = /** @type {CreateGameErrors} */ ({});

    // Game name
    if (!values.GameName) {
      errors.GameName = "The game must have a name!";
    } else if (values.GameName.length > 20) {
      errors.GameName =
        "Name of the game is too long! Must be less than 20 characters";
    }

    // Min players: required, integer in [2..6]
    if (!values.MinPlayers) {
      errors.MinPlayers = "Must specify minimum players";
    } else {
      const minPlayers = Number(values.MinPlayers);
      if (isNaN(minPlayers)) {
        errors.MinPlayers = "Must be a number!";
      } else if (minPlayers < 2 || minPlayers > 6) {
        errors.MinPlayers =
          "Out of range! The game needs between 2 and 6 players to be played";
      }
    }

    // Max players: required, integer in [2..6]
    if (!values.MaxPlayers) {
      errors.MaxPlayers = "Must specify maximum players";
    } else {
      const maxPlayers = Number(values.MaxPlayers);
      if (isNaN(maxPlayers)) {
        errors.MaxPlayers = "Must be a number!";
      } else if (maxPlayers < 2 || maxPlayers > 6) {
        errors.MaxPlayers =
          "Out of range! The game needs between 2 and 6 players to be played";
      }
    }

    // Player name
    if (!values.PlayerName) {
      errors.PlayerName = "You must have a name!";
    } else if (values.PlayerName.length > 20) {
      errors.PlayerName = "Name too long! Must be less than 20 characters";
    }

    // Player birthday: required, not in the future
    if (!values.PlayerBirthday) {
      errors.PlayerBirthday = "You must say your birthday!";
    } else {
      const birthDate = new Date(values.PlayerBirthday);
      const today = new Date();
      if (birthDate > today) {
        errors.PlayerBirthday = "Date cannot be in the future";
      }
    }

    // Password: required only if game is private
    if (values.IsPrivate && !values.Password) {
      errors.Password = "Password is required for private games";
    }

    // Cross-field consistency: min ≤ max
    if (!errors.MinPlayers && !errors.MaxPlayers) {
      const minPlayers = Number(values.MinPlayers);
      const maxPlayers = Number(values.MaxPlayers);
      if (minPlayers > maxPlayers) {
        errors.MinPlayers = "Inconsistent with Max. Players";
        errors.MaxPlayers = "Inconsistent with Min. Players";
      }
    }

    return errors;
  };

  /**
   * Submit handler:
   * - Prevent default
   * - Validate
   * - POST → /games
   * - On success, redirect to /game/:gameId?playerId=:ownerId
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // guard re-entrance

    const errors = validate(settings);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true); // lock UI during request

    // Build API payload (convert number-like strings)
    const requestData = {
      player_info: {
        playerName: settings.PlayerName,
        birthDate: String(settings.PlayerBirthday),
        avatar: settings.Avatar ? Number(settings.Avatar) : undefined,
      },
      game_info: {
        gameName: settings.GameName,
        minPlayers: Number(settings.MinPlayers),
        maxPlayers: Number(settings.MaxPlayers),
        password: settings.IsPrivate ? settings.Password : null,
      },
    };

    try {
      const response = await fetch("http://localhost:8000/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // preserve cookies/session if backend needs it
        body: JSON.stringify(requestData),
      });

      // On failure, send user back to home. Keep logging minimal but useful.
      if (!response.ok) {
        console.error("Request failed:", response.statusText);
        setSubmitting(false);
        navigate(`/`);
        return;
      }

      // Expect { gameId, ownerId }
      const data = await response.json();
      const fetchedId = data.gameId;
      const fetchedPlayerId = data.ownerId;

      // Success → navigate to the new game's screen as the owner
      navigate(`/game/${fetchedId}?playerId=${fetchedPlayerId}`);
      // Note: no unlock needed; navigation will unmount this component.
    } catch (error) {
      console.error("Request error:", error);
      setSubmitting(false);
      navigate(`/`);
    }
  };

  return (
    <div className="create-game-container">
      <div className="create-game-wrapper">
        {/* Header */}
        <div className="create-game-header">
          <h1 className="create-game-title">Create New Game</h1>
        </div>

        {/* Two-column layout: Game Settings | Your Information */}
        <form onSubmit={handleSubmit} className="create-game-form">
          <div className="form-columns">
            {/* Game Settings column */}
            <div className="form-column">
              <div className="column-header">
                <h2 className="section-title">Game Settings</h2>
              </div>

              <fieldset className="form-section">
                {/* Game name */}
                <div className="form-group">
                  <label htmlFor="gameName" className="form-label">
                    Game Name
                  </label>
                  <input
                    id="gameName"
                    type="text"
                    value={settings.GameName}
                    onChange={(e) =>
                      setSettings({ ...settings, GameName: e.target.value })
                    }
                    className="form-input"
                  />
                  <div className="error-container">
                    <p className="error-message">{formErrors.GameName}</p>
                  </div>
                </div>

                {/* Min/Max players row */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="minPlayers" className="form-label">
                      Minimum Players
                    </label>
                    <input
                      id="minPlayers"
                      type="number"
                      min="2"
                      max="6"
                      value={settings.MinPlayers}
                      onChange={(e) =>
                        setSettings({ ...settings, MinPlayers: e.target.value })
                      }
                      className="form-input"
                    />
                    <div className="error-container">
                      <p className="error-message">{formErrors.MinPlayers}</p>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="maxPlayers" className="form-label">
                      Maximum Players
                    </label>
                    <input
                      id="maxPlayers"
                      type="number"
                      min="2"
                      max="6"
                      value={settings.MaxPlayers}
                      onChange={(e) =>
                        setSettings({ ...settings, MaxPlayers: e.target.value })
                      }
                      className="form-input"
                    />
                    <div className="error-container">
                      <p className="error-message">{formErrors.MaxPlayers}</p>
                    </div>
                  </div>
                </div>

                {/* Private game checkbox */}
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.IsPrivate}
                      onChange={(e) =>
                        setSettings({ 
                          ...settings, 
                          IsPrivate: e.target.checked,
                          Password: e.target.checked ? settings.Password : ""
                        })
                      }
                      className="checkbox-input"
                    />
                    Private
                  </label>
                </div>

                {/* Password field - only shown if private */}
                {settings.IsPrivate && (
                  <div className="form-group">
                    <label htmlFor="gamePassword" className="form-label">
                      Password
                    </label>
                    <input
                      id="gamePassword"
                      type="password"
                      value={settings.Password}
                      onChange={(e) =>
                        setSettings({ ...settings, Password: e.target.value })
                      }
                      className="form-input"
                      placeholder="Enter the game password"
                    />
                    <div className="error-container">
                      <p className="error-message">{formErrors.Password}</p>
                    </div>
                  </div>
                )}
              </fieldset>
            </div>

            {/* Player Information column */}
            <div className="form-column">
              <div className="column-header">
                <h2 className="section-title">Your Information</h2>
              </div>

              <fieldset className="form-section">
                {/* Owner name */}
                <div className="form-group">
                  <label htmlFor="yourName" className="form-label">
                    Your Name
                  </label>
                  <input
                    id="yourName"
                    type="text"
                    value={settings.PlayerName}
                    onChange={(e) =>
                      setSettings({ ...settings, PlayerName: e.target.value })
                    }
                    className="form-input"
                  />
                  <div className="error-container">
                    <p className="error-message">{formErrors.PlayerName}</p>
                  </div>
                </div>

                {/* Owner birthday */}
                <div className="form-group">
                  <label htmlFor="yourBirthday" className="form-label">
                    Your Birthday
                  </label>
                  <input
                    id="yourBirthday"
                    type="date"
                    value={settings.PlayerBirthday}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        PlayerBirthday: e.target.value,
                      })
                    }
                    className="form-input"
                  />
                  <div className="error-container">
                    <p className="error-message">{formErrors.PlayerBirthday}</p>
                  </div>
                </div>

                {/* Avatar selection */}
                <div className="form-group">
                  <label className="form-label">Your Avatar</label>
                  <div className="avatar-row">
                    <button
                      type="button"
                      className="choose-avatar-button"
                      onClick={() => setShowAvatarPicker(true)}
                      disabled={submitting}
                    >
                      Choose <br /> Avatar
                    </button>

                    <div className="avatar-preview">
                      <img
                        src={AVATAR_MAP[settings.Avatar]}
                        alt="Selected avatar"
                      />
                    </div>
                  </div>
                </div>
              </fieldset>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="create-game-submit-button"
            disabled={submitting}
            aria-busy={submitting}
            aria-disabled={submitting}
          >
            {submitting ? "Creating..." : "Create Game"}
          </button>
        </form>

        {/* Avatar modal (controlled) */}
        <AvatarPicker
          isOpen={showAvatarPicker}
          onClose={() => setShowAvatarPicker(false)}
          onSelect={(id) => setSettings((s) => ({ ...s, Avatar: String(id) }))}
          selectedId={Number(settings.Avatar)}
          ids={[1, 2, 3, 4, 5, 6]}
        />
      </div>
    </div>
  );
}
