import "./JoinGameForm.css";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";


export default function JoinGameForm() {

  const [settings, setSettings] = useState({PlayerName: "", PlayerBirthday: ""});
  const [formErrors, setFormErrors] = useState({})

  const { gameId } = useParams();
  const navigate = useNavigate();

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
          const response = await fetch(`http://localhost:8000/games/${gameId}/join`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json', 
            },
            body: JSON.stringify(requestData)
          });

          if (!response.ok) {
            navigate(`/join`);
        } else {
          console.log(response.status, response.statusText);

          const data = await response.json()

          const fetchedId = data.gameId
          const fetchedPlayerId = data.actualPlayerId

          if (fetchedId != gameId) {
            navigate(`/join`);
          } else {
            navigate(`/game/${fetchedId}?playerId=${fetchedPlayerId}`);
          }
        }

          } catch (error) {
          console.error('Error en la solicitud:', error);
          navigate(`/join`);
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
