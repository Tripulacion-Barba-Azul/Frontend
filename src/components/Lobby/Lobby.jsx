import './Lobby.css';

import StartGameButton from '../StartGameButton/StartGameButton';

function Lobby(props){
    const isCreator = props.CurrentUser === props.MatchCreator;
    
    const ensureCreatorAndCurrentUserInPlayers = () => {
        const players = props.Players || [];
        
        // Crear conjunto de jugadores esenciales (sin duplicados)
        const essentialPlayers = new Set();
        essentialPlayers.add(props.MatchCreator);
        essentialPlayers.add(props.CurrentUser);
        
        // Filtrar jugadores originales que no sean esenciales
        const otherPlayers = players.filter(player => 
            player !== props.MatchCreator && player !== props.CurrentUser
        );
        
        // Convertir jugadores esenciales a array y agregar otros jugadores
        const essentialArray = Array.from(essentialPlayers);
        const allPlayers = [...essentialArray, ...otherPlayers];
        
        // Limitar al máximo de jugadores permitidos
        return allPlayers.slice(0, props.MaxPlayers);
    };
    
    const playersWithCreatorAndCurrent = ensureCreatorAndCurrentUserInPlayers();
    
    // Verificar si se alcanzó la cantidad mínima de jugadores
    const hasMinimumPlayers = playersWithCreatorAndCurrent.length >= props.MinPlayers;
    
    // Verificar si se alcanzó la cantidad máxima de jugadores
    const hasMaximumPlayers = playersWithCreatorAndCurrent.length >= props.MaxPlayers;

    return(
        <div className='Lobby'>
            <h2>Partida: {props.MatchName}</h2>
            <h2>Creador de la partida: {props.MatchCreator}</h2>
            <h2>Min: {props.MinPlayers}, Max: {props.MaxPlayers} </h2>

            <div className='players-section'>
                <h3>
                    Jugadores en espera ({playersWithCreatorAndCurrent.length})
                    {hasMaximumPlayers && <span className='full-lobby-badge'> - PARTIDA LLENA</span>}
                    :
                </h3>
                <ul className='players-list'>
                    {playersWithCreatorAndCurrent.length > 0 ? (
                        playersWithCreatorAndCurrent.map((player, index) => (
                            <li key={index} className='player-item'>
                                {player}
                                {player === props.MatchCreator && <span className='creator-badge'> (Creador)</span>}
                                {player === props.CurrentUser && <span className='current-badge'> (Tú)</span>}
                            </li>
                        ))
                    ) : (
                        <li className='no-players'>No hay jugadores en la partida</li>
                    )}
                </ul>
                {isCreator && (
                    <StartGameButton 
                        disabled={!hasMinimumPlayers}
                        onClick={props.onStartGame}
                    />
                )}
            </div>
        </div>
    )
}


export default Lobby;