import { useState } from "react";
//falta hacer el .css pero como le faltan un par de cosas no lo hice

export default function CreateGameForm() {
  const [settings, setSettings] = useState({GameName: "", MinPlayers: "", MaxPlayers: "", PlayerName: "", PlayerBirthday: ""});
  const [formErrors, setFormErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormErrors(validate(settings))
    //falta hacer el request a la api adentro de un if (errors = {})
  }

  const validate = (values) => {
    //Falta validar cantidad de caracteres pero depende de cómo está hecho el back
    const errors = {};
    if(!values.GameName) {
      errors.GameName = "The game must have a name!";
    }
    if(!values.MinPlayers) {
      errors.MinPlayers = "Must specify minimum players";
    } else if(values.MinPlayers < 2 || values.MinPlayers > 6) {
      errors.MinPlayers = "Out of range ! The game needs between 2 and 6 players to be played"
    } // <-- no debería pasar pero por las dudas
    if(!values.MaxPlayers) {
      errors.MaxPlayers = "Must specify maximum players";
    } else if(values.MaxPlayers < 2 || values.MaxPlayers > 6) {
      errors.MaxPlayers = "Out of range ! The game needs between 2 and 6 players to be played"
    } // <-- no debería pasar pero por las dudas
    if(!values.PlayerName) {
      errors.PlayerName = "You must have a name!";
    }
    if (values.MinPlayers>values.MaxPlayers) {
      errors.MinPlayers = "Inconsistent with Max. Players"
      errors.MaxPlayers = "Inconsistent with Min. Players"
    }

    return errors;
  };

  //falta el cumpleaños en el form pero no sé que formato usan en el main.
  //probablemente haya que sacarle los linebreaks al hacer el css
   return (
    <form onSubmit={handleSubmit}>
      <label> Game name</label>
      <br />
      <input 
        type="text" value={settings.GameName}
        onChange={(e) => setSettings( {...settings, GameName: e.target.value})}
        placeholder="gamename"
      />
      <p>{formErrors.GameName}</p>

      <br />

      <label> Minimum Players</label>
      <br />
      <input 
        type="number" value={settings.MinPlayers}
        onChange={(e) => setSettings( {...settings, MinPlayers: e.target.value})}
        min="2"
        max="6"
        placeholder="Min. Players"
      />
      <p>{formErrors.MinPlayers}</p>
      <br />

      <label> Maximum Players</label>
      <br />
      <input 
        type="number" value={settings.MaxPlayers}
        onChange={(e) => setSettings( {...settings, MaxPlayers: e.target.value})}
        min="2"
        max="6"
        placeholder="Max. Players"
      />
      <p>{formErrors.MaxPlayers}</p>
      <br />
      <br />
      <br />

      <label> Your name</label>
      <br />
      <input 
        type="text" value={settings.PlayerName}
        onChange={(e) => setSettings( {...settings, PlayerName: e.target.value})}
        placeholder="Your Name"
      />
      <p>{formErrors.PlayerName}</p>
      <br />
      <br />

      {/* <input type="date" value={settings.PlayerBirthday}
        onChange={(e) => setSettings(...settings, e.target.value)}
        placeholder="Your Birthday"
      /> */}

      <button>CREATE</button>

    </form>
  );
}

