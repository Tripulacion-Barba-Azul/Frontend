import "./CreateGameForm.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AvatarPicker from "../../AvatarPicker/AvatarPicker";
import { AVATAR_MAP } from "../../../generalMaps";

export default function CreateGameForm() {
  const [settings, setSettings] = useState({
    GameName: "defaultGame",
    MinPlayers: "2",
    MaxPlayers: "6",
    PlayerName: "defaultName",
    PlayerBirthday: "1990-01-01",
    Avatar: "1",
  });

  const [formErrors, setFormErrors] = useState({});
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const validate = (values) => {
    const errors = {};
    if (!values.GameName) {
      errors.GameName = "The game must have a name!";
    } else if (values.GameName.length > 20) {
      errors.GameName =
        "Name of the game is too long! Must be less than 20 characters";
    }

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent multiple fast submits
    if (submitting) return;

    const errors = validate(settings);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true); // lock UI

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
      },
    };

    try {
      const response = await fetch("http://localhost:8000/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        console.error("Request failed:", response.statusText);
        setSubmitting(false); // unlock on failure
        navigate(`/`);
        return;
      }

      const data = await response.json();
      const fetchedId = data.gameId;
      const fetchedPlayerId = data.ownerId;

      // Navigation will unmount the component; no need to unlock
      navigate(`/game/${fetchedId}?playerId=${fetchedPlayerId}`);
    } catch (error) {
      console.error("Request error:", error);
      setSubmitting(false); // unlock on failure
      navigate(`/`);
    }
  };

  return (
    <div className="create-game-container">
      <div className="create-game-wrapper">
        <div className="create-game-header">
          <h1 className="create-game-title">Create New Game</h1>
        </div>

        <form onSubmit={handleSubmit} className="create-game-form">
          <div className="form-columns">
            {/* Game Settings Column */}
            <div className="form-column">
              <div className="column-header">
                <h2 className="section-title">Game Settings</h2>
              </div>
              <fieldset className="form-section">
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
              </fieldset>
            </div>

            {/* Player Information Column */}
            <div className="form-column">
              <div className="column-header">
                <h2 className="section-title">Your Information</h2>
              </div>
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
                  />
                  <div className="error-container">
                    <p className="error-message">{formErrors.PlayerName}</p>
                  </div>
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
            </div>
          </div>

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
