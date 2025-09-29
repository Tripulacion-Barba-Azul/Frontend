import "./StartGameButton.css"

function StartGameButton({ disabled, gameId, actualPlayerId, onStartGame}){
    
    const handleStartGame = async () => {
        if (disabled) return;
        
        try {
            const response = await fetch(`http://localhost:8000/games/${gameId}/join?ownerId=${actualPlayerId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('Game started successfully:', data);
            
            if (onStartGame) {
                onStartGame();
              }
            
        } catch (error) {
            console.error('Error starting game:', error);
        }
    };

    return(
        <div>
            <button 
                className={`StartGameButton ${disabled ? 'disabled' : ''}`}
                disabled={disabled}
                onClick={handleStartGame}
            >
                Start Game
            </button>
        </div>
    );
}

export default StartGameButton
