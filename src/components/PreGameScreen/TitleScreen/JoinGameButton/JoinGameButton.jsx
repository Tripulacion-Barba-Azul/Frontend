import "./JoinGameButton.css"
import { useNavigate } from "react-router-dom";

export default function JoinGameButton () {

    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/join`);
      };

    return(<div> 
        <button onClick={handleClick} className="JoinGameButton">Join Game</button>
    </div>);
}