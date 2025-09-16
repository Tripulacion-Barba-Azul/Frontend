import "./StartGameButton.css"

function StartGameButton({ disabled, onClick }){
    return(
        <div>
            <button 
                className={`StartGameButton ${disabled ? 'disabled' : ''}`}
                disabled={disabled}
                onClick={onClick}
            >
                Start Game
            </button>
        </div>
    );
}

export default StartGameButton
