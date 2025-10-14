import "./CreateGameForm.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AvatarPicker from "../../AvatarPicker/AvatarPicker";
import { AVATAR_MAP } from "../../../generalMaps";

export default function CreateGameForm() {
  const [settings, setSettings] = useState({
    GameName: "",
    MinPlayers: "",
    MaxPlayers: "",
    PlayerName: "",
    PlayerBirthday: "",
    Avatar: "1",
  });
  const [formErrors, setFormErrors] = useState({});
  const [showAvatarPicker, setShowAvatarPicker] = useState(false); // ★

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    const errors = validate(settings);
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
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

      async function postData() {
        try {
          const response = await fetch("http://localhost:8000/games", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData),
          });

          if (!response.ok) {
            console.error("Error en la solicitud:", response.statusText);
            navigate(`/`);
          } else {
            const data = await response.json();
            const fetchedId = data.gameId;
            const fetchedPlayerId = data.ownerId;
            navigate(`/game/${fetchedId}?playerId=${fetchedPlayerId}`);
          }
        } catch (error) {
          console.error("Error en la solicitud:", error);
          navigate(`/`);
        }
      }

      postData();
    }
  };

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
    } else if (values.MinPlayers < 2 || values.MinPlayers > 6) {
      errors.MinPlayers =
        "Out of range ! The game needs between 2 and 6 players to be played";
    } else if (isNaN(values.MinPlayers)) {
      errors.MinPlayers = "Must be a number!";
    }
    if (!values.MaxPlayers) {
      errors.MaxPlayers = "Must specify maximum players";
    } else if (values.MaxPlayers < 2 || values.MaxPlayers > 6) {
      errors.MaxPlayers =
        "Out of range ! The game needs between 2 and 6 players to be played";
    } else if (isNaN(values.MaxPlayers)) {
      errors.MaxPlayers = "Must be a number!";
    }
    if (!values.PlayerName) {
      errors.PlayerName = "You must have a name!";
    } else if (values.PlayerName.length > 20) {
      errors.PlayerName = "Name too long! Must be less than 20 characters";
    }
    if (values.MinPlayers > values.MaxPlayers) {
      errors.MinPlayers = "Inconsistent with Max. Players";
      errors.MaxPlayers = "Inconsistent with Min. Players";
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
        {/* Game info */}
        <fieldset className="section">
          <legend className="sectionTitle"></legend>

          <label htmlFor="gameName"> Game name</label>
          <input
            id="gameName"
            type="text"
            value={settings.GameName}
            onChange={(e) =>
              setSettings({ ...settings, GameName: e.target.value })
            }
            placeholder="Game name"
          />
          <p className="error">{formErrors.GameName}</p>

          <label htmlFor="minPlayers"> Minimum Players</label>
          <input
            id="minPlayers"
            type="number"
            value={settings.MinPlayers}
            onChange={(e) =>
              setSettings({ ...settings, MinPlayers: Number(e.target.value) })
            }
            placeholder="Min. Players"
          />
          <p className="error">{formErrors.MinPlayers}</p>

          <label htmlFor="maxPlayers"> Maximum Players</label>
          <input
            id="maxPlayers"
            type="number"
            value={settings.MaxPlayers}
            onChange={(e) =>
              setSettings({ ...settings, MaxPlayers: Number(e.target.value) })
            }
            placeholder="Max. Players"
          />
          <p className="error">{formErrors.MaxPlayers}</p>
        </fieldset>

        {/* User Info */}
        <fieldset className="section">
          <legend className="sectionTitle"></legend>

          <label htmlFor="yourName"> Your Name</label>
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

          <label htmlFor="yourBirthday"> Your Birthday</label>
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
              <img src={AVATAR_MAP[settings.Avatar]} alt="" />
            </div>
          </div>
          <p className="error">{formErrors.Avatar}</p>
        </fieldset>

        <button>CREATE</button>
      </form>

      <AvatarPicker
        isOpen={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        onSelect={(id) => setSettings((s) => ({ ...s, Avatar: String(id) }))}
        selectedId={Number(settings.Avatar)}
        ids={[1, 2, 3, 4, 5, 6]}
      />
    </div>
  );
}
