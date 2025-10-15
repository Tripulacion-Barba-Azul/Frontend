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

  const handleSubmit = async (e) => {  // Make it async
    e.preventDefault();
    const errors = validate(settings);
    setFormErrors(errors);
  
    if (Object.keys(errors).length === 0) {
      const requestData = {
        playerName: settings.PlayerName,
        birthDate: String(settings.PlayerBirthday),
        avatar: settings.Avatar ? Number(settings.Avatar) : undefined,
      };
  
      async function postData() {
        try {
          const response = await fetch(
            `http://localhost:8000/games/${gameId}/join`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(requestData),
            }
          );
  
          if (!response.ok) {
            console.error("Error joining game:", response.statusText);
            navigate(`/join`);
          } else {
            const data = await response.json();
            const fetchedId = data.gameId;
            const fetchedPlayerId = data.actualPlayerId;
  
            if (fetchedId != gameId) {
              navigate(`/join`);
            } else {
              navigate(`/game/${fetchedId}?playerId=${fetchedPlayerId}`);
            }
          }
        } catch (error) {
          console.error("Error in request:", error);
          navigate(`/join`);
        }
      }
  
      await postData();  // Await the async function
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
                >
                  Choose <br /> Avatar
                </button>
                <div className="avatar-preview">
                  <img src={AVATAR_MAP[settings.Avatar]} alt="Selected avatar" />                
                </div>
              </div>
            </div>
          </fieldset>

          <button type="submit" className="join-game-submit-button">
            Join Game
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
