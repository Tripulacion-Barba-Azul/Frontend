import "./JoinGameForm.css";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AvatarPicker from "../../AvatarPicker/AvatarPicker";
import { AVATAR_MAP } from "../../AvatarPicker/AvatarPickerConstants";

export default function JoinGameForm() {
  const [settings, setSettings] = useState({
    PlayerName: "",
    PlayerBirthday: "",
    avatar: "1",
  });
  const [formErrors, setFormErrors] = useState({});
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const { gameId } = useParams();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    const errors = validate(settings);
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      const requestData = {
        playerName: settings.PlayerName,
        birthDate: String(settings.PlayerBirthday),
        avatar: settings.avatar ? Number(settings.avatar) : undefined,
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
            console.error("Error en la solicitud:", error);
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
          console.error("Error en la solicitud:", error);
          navigate(`/join`);
        }
      }

      postData();
    }
  };

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

  return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <label htmlFor="yourName">Your Name</label>
        <br />
        <input
          id="yourName"
          type="text"
          value={settings.PlayerName}
          onChange={(e) =>
            setSettings({ ...settings, PlayerName: e.target.value })
          }
          placeholder="Your Name"
        />
        <p className="error">{formErrors.PlayerName}</p>
        <br />

        <label htmlFor="yourBirthday">Your Birthday</label>
        <br />
        <input
          id="yourBirthday"
          type="date"
          value={settings.PlayerBirthday}
          onChange={(e) =>
            setSettings({ ...settings, PlayerBirthday: e.target.value })
          }
          placeholder="Your Birthday"
        />
        <p className="error">{formErrors.PlayerBirthday}</p>
        <br />

        <label>Your Avatar</label>
        <div className="AvatarRow">
          <button
            type="button"
            className="chooseBtn"
            onClick={() => setShowAvatarPicker(true)}
          >
            Choose Avatar
          </button>

          <div
            className="AvatarPreview"
            role="img"
            aria-label="Selected avatar"
          >
            <img src={AVATAR_MAP[settings.avatar]} alt="" />
          </div>
        </div>
        <p className="error">{formErrors.avatar}</p>

        <button>Join</button>
      </form>

      <AvatarPicker
        isOpen={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        onSelect={(id) => setSettings((s) => ({ ...s, avatar: String(id) }))}
        selectedId={Number(settings.avatar)}
        ids={[1, 2, 3, 4, 5, 6]}
      />
    </div>
  );
}
