import "./CancelGameButton.css"

function CancelGameButton({ disabled, gameId, actualPlayerId, onCancelGame}){
    
    const handleCancelGame = async () => {
        if (disabled) return;
        
        try {
            const response = await fetch(`https://dotc-production.up.railway.app/games/${gameId}/delete?player_id=${actualPlayerId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
