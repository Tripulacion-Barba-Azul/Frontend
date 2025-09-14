import "./CreateGameButton.css"
import { useNavigate } from "react-router-dom";

export default function CreateGameButton () {
    const navigate = useNavigate();

    return(<div> 
        <button className="CreateGameButton" onClick={() => navigate("/Create_Game")} 
        >Create <br /> Game
        </button>
    </div>);
}