import "./JoinGameForm.css";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AvatarPicker from "../../AvatarPicker/AvatarPicker";
import { AVATAR_MAP } from "../../../generalMaps";

export default function JoinGameForm() {
  const [settings, setSettings] = useState({
    PlayerName: "defaultName",
    PlayerBirthday: "1990-01-01",
    Avatar: "1",
  });
  const [formErrors, setFormErrors] = useState({});
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false); // NEW: request lock

  const { gameId } = useParams();
  const navigate = useNavigate();

  const validate = (values) => {
    const errors = {};
    if (!values.PlayerName) {
      errors.PlayerName = "You must have a name!";
    } else if (values.PlayerName.length > 20) {
      errors.PlayerName = "Name too long! Must be less than 20 characters";
    }
    if (!values.PlayerBirthday) {
      errors.PlayerBirthday = "You must say your birthday!";
    } else {
      const birthDate = new Date(values.PlayerBirthday);
      const today = new Date();
      if (birthDate > today) {
        errors.PlayerBirthday = "Date cannot be in the future";
      }
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate fast submits
    if (submitting) return;

    const errors = validate(settings);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true); // lock UI

    const requestData = {
      playerName: settings.PlayerName,
      birthDate: String(settings.PlayerBirthday),
      avatar: settings.Avatar ? Number(settings.Avatar) : undefined,
    };

    try {
      const response = await fetch(
        `http://localhost:8000/games/${gameId}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        console.error("Error joining game:", response.statusText);
        setSubmitting(false); // unlock on failure
        navigate(`/join`);
        return;
      }

      const data = await response.json();
      const fetchedId = data.gameId;
      const fetchedPlayerId = data.actualPlayerId;

      if (String(fetchedId) !== String(gameId)) {
        setSubmitting(false); // unlock before redirecting back
        navigate(`/join`);
        return;
      }

      // Navigation will unmount the component; no need to unlock
      navigate(`/game/${fetchedId}?playerId=${fetchedPlayerId}`);
    } catch (error) {
      console.error("Error in request:", error);
      setSubmitting(false); // unlock on failure
      navigate(`/join`);
    }
  };

  return (
    <div className="join-game-container">
      <div className="join-game-wrapper">
        <div className="join-game-header">
          <h1 className="join-game-title">Join Game</h1>
        </div>

        <form onSubmit={handleSubmit} className="join-game-form">
          <fieldset className="form-section">
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
              <p className="error-message">{formErrors.PlayerName}</p>
            </div>

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
              />
              <p className="error-message">{formErrors.PlayerBirthday}</p>
            </div>

            <div className="form-group">
              <label className="form-label">Your Avatar</label>
              <div className="avatar-row">
                <button
                  type="button"
                  className="choose-avatar-button"
                  onClick={() => setShowAvatarPicker(true)}
                  disabled={submitting} // optional: lock while submitting
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
