// JoinGameForm.jsx

/**
 * @file JoinGameForm.jsx
 * @description Join flow for a specific game. Reads ":gameId" from the URL,
 * validates minimal player info, and POSTs to the server. On success, it
 * redirects to "/game/:gameId?playerId=:actualPlayerId".
 *
 * Props: none (this component does not accept props).
 *
 * UX flow:
 * 1) User enters name + birthday and picks an avatar.
 * 2) Client-side validation runs on submit.
 * 3) If valid, POST to /games/:gameId/join with JSON body.
 * 4) If server accepts, navigate to the game screen with the returned ids.
 *
 * API contract (expected server response shape on success):
 * {
 *   "gameId": string | number,
 *   "actualPlayerId": string
 * }
 *
 * Accessibility:
 * - Inputs are labeled via <label htmlFor="...">.
 * - Error messages are rendered next to fields.
 * - Submit button exposes aria-busy/aria-disabled when submitting.
 */

/**
 * @typedef {Object} JoinFormState
 * @property {string} PlayerName - Display name shown to other players (<= 20 chars).
 * @property {string} PlayerBirthday - ISO date string (YYYY-MM-DD). Must not be in the future.
 * @property {string} Avatar - Avatar id as string (mapped to an image by AVATAR_MAP).
 * @property {string} [Password] - Password for private games (optional).
 */

/**
 * @typedef {Object} JoinFormErrors
 * @property {string} [PlayerName] - Validation message for PlayerName (optional).
 * @property {string} [PlayerBirthday] - Validation message for PlayerBirthday (optional).
 * @property {string} [Password] - Validation message for Password (optional).
 */

import "./JoinGameForm.css";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AvatarPicker from "../AvatarPicker/AvatarPicker";
import { AVATAR_MAP } from "../../../utils/generalMaps";

export default function JoinGameForm(props) {
  /**
   * Local form state.
   * Note: Avatar is stored as string for easy binding with inputs/pickers;
   * convert to number only when sending to the API.
   * @type {[JoinFormState, (s: JoinFormStsate) => void]}
   */
  const [settings, setSettings] = useState({
    PlayerName: "defaultName",
    PlayerBirthday: "1990-01-01",
    Avatar: "1",
    Password: "",
  });

  /** @type {[JoinFormErrors, (e: JoinFormErrors) => void]} */
  const [formErrors, setFormErrors] = useState({});
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Submission lock to prevent duplicate requests (double click / slow network).
  const [ submitting, setSubmitting] = useState(false);

  // Router utilities
  const { gameId } = useParams(); // Read ":gameId" from the URL.
  const navigate = useNavigate();

  /**
   * Minimal synchronous validation.
   * Keep this in sync with any server-side validation to avoid UX mismatches.
   * @param {JoinFormState} values
   * @returns {JoinFormErrors}
   */
  const validate = (values) => {
    const errors = /** @type {JoinFormErrors} */ ({});

    // Name: required + short cap to avoid long UI overflows.
    if (!values.PlayerName) {
      errors.PlayerName = "You must have a name!";
    } else if (values.PlayerName.length > 20) {
      errors.PlayerName = "Name too long! Must be less than 20 characters";
    }

    // Birthday: required + not in the future.
    if (!values.PlayerBirthday) {
      errors.PlayerBirthday = "You must say your birthday!";
    } else {
      const birthDate = new Date(values.PlayerBirthday);
      const today = new Date();
      if (birthDate > today) {
        errors.PlayerBirthday = "Date cannot be in the future";
      }
    }

    // Password: required only for private games.
    if (props.private && !values.Password) {
      errors.Password = "Password is required for private games!";
    }

    return errors;
  };

  /**
   * Submit handler:
   * - Prevent default form submit
   * - Validate locally
   * - POST to /games/:gameId/join
   * - On success, redirect to /game/:id?playerId=:pid
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // Guard re-entrance

    const errors = validate(settings);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return; // Stop on invalid

    setSubmitting(true);

    // API shape: avatar is optional; send as number if present.
    const requestData = {
      playerName: settings.PlayerName,
      birthDate: String(settings.PlayerBirthday),
      avatar: settings.Avatar ? Number(settings.Avatar) : undefined,
      password: props.private  ? settings.Password : null,
    };

    try {
      const response = await fetch(
        `http://localhost:8000/games/${gameId}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // keep cookies/session if server uses them
          body: JSON.stringify(requestData),
        }
      );

      // On any non-2xx, exit to the generic /join screen
      if (!response.ok) {
        setSubmitting(false);
        navigate(`/join`);
        return;
      }

      // Expect { gameId, actualPlayerId }
      const data = await response.json();
      const fetchedId = data.gameId;
      const fetchedPlayerId = data.actualPlayerId;

      // Safety check: the server should echo back the same game id
      if (String(fetchedId) !== String(gameId)) {
        setSubmitting(false);
        navigate(`/join`);
        return;
      }

      // Navigate to the live game screen with the player's id as query param
      navigate(`/game/${fetchedId}?playerId=${fetchedPlayerId}`);
    } catch (error) {
      // Network/parse errors land here
      console.error("Error in request:", error);
      setSubmitting(false);
      navigate(`/join`);
    }
  };

  return (
    <div className={`join-game-container ${props.private ? 'private-game' : ''}`}>
      <div className="join-game-wrapper">
        {/* Header area */}
        <div className="join-game-header">
          <h1 className="join-game-title">
            {props.private ? "Join Private Game" : "Join Game"}
          </h1>
        </div>

        {/* Form: keep groups aligned to CSS Modules for easy theming */}
        <form onSubmit={handleSubmit} className="join-game-form">
          <fieldset className={`form-section ${props.private ? 'form-section-private' : ''}`}>
            {/* Player name */}
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
                disabled={submitting}
              />
              {/* Inline error message (if any) */}
              <p className="error-message">{formErrors.PlayerName}</p>
            </div>

            {/* Player birthday */}
            <div className="form-group">
              <label htmlFor="yourBirthday" className="form-label">
                Your Birthday
              </label>
              <input
                id="yourBirthday"
                type="date"
                value={settings.PlayerBirthday}
                onChange={(e) =>
                  setSettings({ ...settings, PlayerBirthday: e.target.value })
                }
                className="form-input"
                disabled={submitting}
                // Browser-native date input handles basic formatting
              />
              <p className="error-message">{formErrors.PlayerBirthday}</p>
            </div>

            {/* Password field - only for private games */}
            {props.private && (
              <div className="form-group">
                <label htmlFor="gamePassword" className="form-label">
                  Game Password
                </label>
                <input
                  id="gamePassword"
                  type="password"
                  value={settings.Password}
                  onChange={(e) =>
                    setSettings({ ...settings, Password: e.target.value })
                  }
                  className="form-input"
                  disabled={submitting}
                  placeholder="Enter the game password"
                />
                <p className="error-message">{formErrors.Password}</p>
              </div>
            )}

            {/* Avatar picker (modal) */}
            <div className="form-group">
              <label className="form-label">Your Avatar</label>

              <div className="avatar-row">
                {/* Opens the avatar modal. Keep button separate from preview for clarity. */}
                <button
                  type="button"
                  className="choose-avatar-button"
                  onClick={() => setShowAvatarPicker(true)}
                  disabled={submitting}
                >
                  Choose <br /> Avatar
                </button>

                {/* Live preview based on AVATAR_MAP and current selection */}
                <div className="avatar-preview">
                  <img
                    src={AVATAR_MAP[settings.Avatar]}
                    alt="Selected avatar"
                  />
                </div>
              </div>
            </div>
          </fieldset>

          {/* Submit. aria-busy + aria-disabled advertise async state to ATs */}
          <button
            type="submit"
            className="join-game-submit-button"
            disabled={submitting}
            aria-busy={submitting}
            aria-disabled={submitting}
          >
            {submitting ? "Joining..." : "Join Game"}
          </button>
        </form>

        {/* Modal for avatar selection */}
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
