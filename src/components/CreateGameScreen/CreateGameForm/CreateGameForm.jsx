import "./CreateGameForm.css";
import { useState } from "react";

export default function CreateGameForm() {

  const [settings, setSettings] = useState({GameName: "", MinPlayers: "", MaxPlayers: "", PlayerName: "", PlayerBirthday: ""});
  const [formErrors, setFormErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault();

    const errors = (validate(settings));
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      const requestData = {
        player_info: {
          playerName: settings.PlayerName,
          birthDate: String(settings.PlayerBirthday),
        },
        game_info: {
          gameName: settings.GameName,
          minPlayers: Number(settings.MinPlayers),
          maxPlayers: Number(settings.MaxPlayers),
        }
      }

      async function postData() {
        try {
          const response = await fetch("http://localhost:8000/games", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json', 
            },
            body: JSON.stringify(requestData)
          });

          if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }

          console.log(response.status, response.statusText);

          const gameID = response.body.gameID;
          const yourID = response.body.ownerId;

          //IMPORTANTE: en "response.body" (o en otro lado qsy) debería contener el ID de la partida.
          //en caso de 200 OK, se debería redirigir al usuario al lobby de esa partida.
          //(con la función navigate)
          // Si hay un error, (no debería) probablemente hay que redirigir al usuario a la title screen

          } catch (error) {
          console.error('Error en la solicitud:', error);
          }
      }

      postData();

    }
  }


  const validate = (values) => {
    const errors = {};
    if(!values.GameName) {
      errors.GameName = "The game must have a name!";
    } else if (values.GameName.length > 20) {
      errors.GameName = "Name of the game is too long! Must be less than 20 characters";
    }
    if(!values.MinPlayers) {
      errors.MinPlayers = "Must specify minimum players";
    } else if(values.MinPlayers < 2 || values.MinPlayers > 6) {
      errors.MinPlayers = "Out of range ! The game needs between 2 and 6 players to be played"
    } else if (isNaN(values.MinPlayers)) {
      errors.MinPlayers = "Must be a number!"
    }// <-- no debería pasar pero por las dudas
    if(!values.MaxPlayers) {
      errors.MaxPlayers = "Must specify maximum players";
    } else if(values.MaxPlayers < 2 || values.MaxPlayers > 6) {
      errors.MaxPlayers = "Out of range ! The game needs between 2 and 6 players to be played"
    } else if (isNaN(values.MaxPlayers)) {
      errors.MaxPlayers = "Must be a number!"
    } // <-- no debería pasar pero por las dudas
    if(!values.PlayerName) {
      errors.PlayerName = "You must have a name!";
    } else if (values.PlayerName.length > 20) {
      errors.PlayerName = "Name too long! Must be less than 20 characters";
    }
    if (values.MinPlayers>values.MaxPlayers) {
      errors.MinPlayers = "Inconsistent with Max. Players"
      errors.MaxPlayers = "Inconsistent with Min. Players"
    }
    if(!values.PlayerBirthday) {
      errors.PlayerBirthday = "You must say your birthday!";
    } else {
      const birthDate = new Date(values.PlayerBirthday);
      const today = new Date();
        if (birthDate > today) {
          errors.PlayerBirthday = "Date cannot be in the future";
        }
      } // <-- tal vez irrelevante esa condición pero mejor evitar cosas raras

    return errors;  
  };

  //los linebreaks son sacables pero por ahora me sirven
   return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <label htmlFor="gameName"> Game name</label>
        <br />
        <input 
          id="gameName"
          type="text" value={settings.GameName}
          onChange={(e) => setSettings( {...settings, GameName: e.target.value})}
          placeholder="Game name"
        />
        <p className="error">{formErrors.GameName}</p>
    
        <br />
    
        <label htmlFor="minPlayers"> Minimum Players</label>
        <br />
        <input 
          id="minPlayers"
          type="number" value={settings.MinPlayers}
          onChange={(e) => setSettings( {...settings, MinPlayers: Number(e.target.value)})}
          placeholder="Min. Players"
        />
        <p className="error">{formErrors.MinPlayers}</p>
        <br />
    
        <label htmlFor="maxPlayers"> Maximum Players</label>
        <br />
        <input 
          id="maxPlayers"
          type="number" value={settings.MaxPlayers}
          onChange={(e) => setSettings( {...settings, MaxPlayers: Number(e.target.value)})}
          placeholder="Max. Players"
        />
        <p className="error">{formErrors.MaxPlayers}</p>
        <br />
        <br />
        <br />
    
        <label htmlFor="yourName"> Your Name</label>
        <br />
        <input 
          id="yourName"
          type="text" value={settings.PlayerName}
          onChange={(e) => setSettings( {...settings, PlayerName: e.target.value})}
          placeholder="Your Name"
        />
        <p className="error">{formErrors.PlayerName}</p>
        <br />
        
        <label htmlFor="yourBirthday"> Your Birthday</label>
        <br />
        <input 
          id="yourBirthday"
          type="date" value={settings.PlayerBirthday}
          onChange={(e) => setSettings( {...settings, PlayerBirthday: e.target.value})}
          placeholder="Your Birthday"
        /> 
        <p className="error">{formErrors.PlayerBirthday}</p>
        <br />
        <br />
  
        <button>CREATE</button>
      
      </form>
    </div>
  );
  
}
