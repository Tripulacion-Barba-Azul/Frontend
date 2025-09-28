import "./JoinGameForm.css";
import { useState } from "react";

const gameID = "1" 
//utilizo el ID 2 a modo de ejemplo pero acá debería obtener el ID de la partida en base a la URL en la que estoy

export default function JoinGameForm() {

  const [settings, setSettings] = useState({PlayerName: "", PlayerBirthday: ""});
  const [formErrors, setFormErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault();

    const errors = (validate(settings));
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      const requestData = {
        playerName: settings.PlayerName,
        birthDate: String(settings.PlayerBirthday)
        }

      async function postData() {
        try {
          const response = await fetch(`http://localhost:8000/games/${gameID}/player`, {
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

          roomId = response.body.gameId
          yourPlayerId = response.body.actualPlayerId

          //IMPORTANTE: 
          // Si todo sale bien, hay que redirigir al lobby de la partida con ese ID. 
          // Tal vez la respuesta puede contener el ID de la partida y podemos compararlo con el ID que teníamos, deberían ser iguales
          // Si hay algún error, (puede haber tranquilamente) se debe redirigir al usuario a la lista de partidas

          } catch (error) {
          console.error('Error en la solicitud:', error);
          }
      }

      postData();

    }
  } 


  const validate = (values) => {
    const errors = {};
    if(!values.PlayerName) {
      errors.PlayerName = "You must have a name!";
    } else if (values.PlayerName.length > 20) {
      errors.PlayerName = "Name too long! Must be less than 20 characters";
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
  
        <button>Join</button>
      
      </form>
    </div>
  );
}
