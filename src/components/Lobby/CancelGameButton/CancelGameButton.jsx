import "./CancelGameButton.css"

function CancelGameButton({ disabled, gameId, actualPlayerId, onCancelGame}){
    
    const handleCancelGame = async () => {
        if (disabled) return;
        
        try {
            const response = await fetch(`http://localhost:8000/games/${gameId}/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerId: actualPlayerId
                })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('Game canceled successfully:', data);
            
            if (onCancelGame) {
                onCancelGame();
            }
            
        } catch (error) {
            console.error('Error canceling game:', error);
        }
    };

    return(
        <div>
            <button 
                className={`CancelGameButton ${disabled ? 'disabled' : ''}`}
                disabled={disabled}
                onClick={handleCancelGame}
            >
                Cancel Game
            </button>
        </div>
    );
}

export default CancelGameButton
