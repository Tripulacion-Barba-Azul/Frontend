import BackgroundBoard from "./BackgroundBoard.jsx";
import PlayerBadge from "./PlayerBadge/PlayerBadge.jsx";

export default function Board() {
  return (
    // Contenedor raíz que define el plano de posicionamiento
    <div className="relative w-full h-screen overflow-hidden">
      {/* Fondo: tu tablero */}
      <BackgroundBoard />

      {/* Capa superior: badges posicionados encima */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Arriba centro */}
        <div className="absolute left-1/2 -translate-x-1/2 [top:0%] pointer-events-auto">
          <PlayerBadge
            name="Jugador 1"
            src="/Board/Icons/defaultIcon.png"
            size="small"
            ringColor="purple"
          />
        </div>

        {/* Arriba izquierda */}
        <div className="absolute [top:5%] [left:15%] pointer-events-auto">
          <PlayerBadge
            name="Jugador 2"
            src="/Board/Icons/defaultIcon.png"
            size="small"
            ringColor="purple"
          />
        </div>

        {/* Arriba derecha */}
        <div className="absolute [top:5%] [right:15%] pointer-events-auto">
          <PlayerBadge
            name="Jugador 3"
            src="/Board/Icons/defaultIcon.png"
            size="small"
            ringColor="purple"
          />
        </div>

        {/* Lateral izquierdo medio */}
        <div className="absolute left-0 [top:42%] translate-x-1/2 pointer-events-auto">
          <PlayerBadge
            name="Jugador 4"
            src="/Board/Icons/defaultIcon.png"
            size="small"
            ringColor="purple"
          />
        </div>

        {/* Lateral derecho medio */}
        <div className="absolute right-0 [top:42%] -translate-x-1/2 pointer-events-auto">
          <PlayerBadge
            name="Jugador 5"
            src="/Board/Icons/defaultIcon.png"
            size="small"
            ringColor="purple"
          />
        </div>

        {/* Abajo centro */}
        <div className="absolute -translate-x-1/2 [left:28%] [bottom:9%] pointer-events-auto">
          <PlayerBadge
            name="Jugador 6"
            src="/Board/Icons/defaultIcon.png"
            size="big"
            ringColor="purple"
          />
        </div>
      </div>
    </div>
  );
}
