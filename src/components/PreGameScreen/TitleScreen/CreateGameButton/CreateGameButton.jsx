import "./CreateGameButton.css"
import { useNavigate } from "react-router-dom";

export default function CreateGameButton () {

    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/create`);
      };

    return(<div> 
        <button onClick={handleClick} className="CreateGameButton" >Create Game</button>
    </div>);
}