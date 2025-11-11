import "./JoinGameForm.css";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AvatarPicker from "../AvatarPicker/AvatarPicker";
import { AVATAR_MAP } from "../../../utils/generalMaps";

export default function JoinGameForm(props) {
  const [settings, setSettings] = useState({
    PlayerName: "defaultName",
    PlayerBirthday: "1990-01-01",
    Avatar: "1",
    Password: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

    if (props.private && !values.Password) {
      errors.Password = "Password is required for private games!";
    } else if (values.Password.length > 20) {
      errors.Password = "Password too long! Must be less than 20 characters";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const errors = validate(settings);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);

    const requestData = {
      playerName: settings.PlayerName,
      birthDate: String(settings.PlayerBirthday),
      avatar: settings.Avatar ? Number(settings.Avatar) : undefined,
      password: props.private ? settings.Password : null,
    };

    try {
      const response = await fetch(
        `http://localhost:8000/games/${gameId}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        setSubmitting(false);

        if (response.status === 401) {
          setFormErrors((prevErrors) => ({
            ...prevErrors,
            Password: "Incorrect password. Please try again.",
          }));
          return;
        }

        navigate(`/join`);
        return;
      }

      const data = await response.json();
      const fetchedId = data.gameId;
      const fetchedPlayerId = data.actualPlayerId;

      if (String(fetchedId) !== String(gameId)) {
        setSubmitting(false);
        navigate(`/join`);
        return;
      }

      navigate(`/game/${fetchedId}?playerId=${fetchedPlayerId}`);
    } catch (error) {
      console.error("Error in request:", error);
      setSubmitting(false);
      navigate(`/join`);
    }
  };

  return (
    <div className={`join-game-container ${props.private ? "private-game" : ""}`}>
      <div className="join-game-wrapper">
        <div className="join-game-header">
          <h1 className="join-game-title">
            {props.private ? "Join Private Game" : "Join Game"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="join-game-form">
          <fieldset
            className={`form-section ${props.private ? "form-section-private" : ""}`}
          >
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
              />
              <p className="error-message">{formErrors.PlayerBirthday}</p>
            </div>

            {/* Password field - only for private games */}
            {props.private && (
              <div className="form-group password-group">
                <label htmlFor="gamePassword" className="form-label">
                  Game Password
                </label>
                <div className="password-wrapper">
                  <input
                    id="gamePassword"
                    type={showPassword ? "text" : "password"}
                    value={settings.Password}
                    onChange={(e) =>
                      setSettings({ ...settings, Password: e.target.value })
                    }
                    className="form-input password-input"
                    disabled={submitting}
                    placeholder="Enter the game password"
                  />

                  <button
                    type="button"
                    className="toggle-password-visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      /* 👁️ Ojo visible */
                      <svg
                        width="1.4vw"
                        height="1.4vw"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden
                      >
                        <path
                          d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
                          stroke="#f4e1a3"
                          strokeWidth="0.078125vw"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          stroke="#f4e1a3"
                          strokeWidth="0.078125vw"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      /* 🚫 Ojo tachado */
                      <svg
                        width="1.4vw"
                        height="1.4vw"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden
                      >
                        <path
                          d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a20.86 20.86 0 013.68-4.32"
                          stroke="#f4e1a3"
                          strokeWidth="0.078125vw"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M1 1l22 22"
                          stroke="#f4e1a3"
                          strokeWidth="0.078125vw"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="error-message">{formErrors.Password}</p>
              </div>
            )}

            {/* Avatar picker */}
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
                  <img src={AVATAR_MAP[settings.Avatar]} alt="Selected avatar" />
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
          ids={[1, 2, 3, 4, 5, 6, 7, 8, 9 ,10]}
        />
      </div>
    </div>
  );
}
