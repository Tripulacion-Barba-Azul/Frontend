import React, { useEffect, useState } from "react";
import { Users, User, Clock, Play, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./GameOwnMatchesList.css";

import { getCookie } from "../../utils/cookies";
import { filterOwnInProgress, parseOwnPairsMap } from "./ownGames";

/**
 * GameOwnMatchesList
 * Visual-only list of the user's active matches.
 * Filters using a cookie (kept up to date by the backend) that contains pairs (gameId, playerId).
 * On click, navigates to: /game/{gameId}?playerId={playerId}
 */

// Change this if your backend uses a different cookie name
const OWN_PAIRS_COOKIE = "DOTC_OWN_PAIRS";

// Your existing endpoint to fetch games (we keep it as-is)
const apiGamesList = "http://localhost:8000/games";

export default function GameOwnMatchesList() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ownPairsMap, setOwnPairsMap] = useState(() => new Map());

  const navigate = useNavigate();

  const fetchMatches = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);

      const res = await fetch(apiGamesList, {
        method: "GET",
        body: JSON.stringify({ activeGames: true }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Map server payload -> UI model; keep gameStatus for filtering
      const all = data.map((game) => ({
        id: game.gameId,
        name: game.gameName,
        creator: game.ownerName,
        minPlayers: game.minPlayers,
        maxPlayers: game.maxPlayers,
        currentPlayers: game.actualPlayers,
        gameStatus: game.gameStatus,
        canJoin: game.actualPlayers < game.maxPlayers,
      }));

      // Cookie -> filter to own + inProgress and build gameId->playerId map
      const cookieRaw = getCookie(OWN_PAIRS_COOKIE);
      const ownActive = filterOwnInProgress(all, cookieRaw);
      setMatches(ownActive);
      setOwnPairsMap(parseOwnPairsMap(cookieRaw));
    } catch (err) {
      console.error("Failed to fetch own matches:", err);
      setMatches([]);
      setOwnPairsMap(new Map());
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches(false);
  }, []);

  const handleRefresh = () => fetchMatches(true);

  // Navigate to /game/{gameId}?playerId={playerId}
  const handleOpenMatch = (matchId) => {
    const gid = Number(matchId);
    const pid = ownPairsMap.get(gid);
    if (typeof pid === "number" && Number.isFinite(pid)) {
      navigate(`/game/${gid}?playerId=${pid}`);
    } else {
      // Fallback (shouldn't happen after filtering): go without playerId
      console.warn("Missing (gameId, playerId) pair for game:", gid);
      navigate(`/game/${gid}`);
    }
  };

  if (loading) {
    return (
      <div
        className="ownmatches-loading"
        style={{
          background: `url('/Assets/background_pregame.jpg') no-repeat center center fixed`,
          backgroundSize: "cover",
        }}
      >
        <div className="ownmatches-spinner" />
        <span>Loading games...</span>
      </div>
    );
  }

  return (
    <div
      className="ownmatches-container"
      style={{
        background: `url('/Assets/background_pregame.jpg') no-repeat center center fixed`,
        backgroundSize: "cover",
      }}
    >
      <div className="ownmatches-wrapper">
        {/* Header */}
        <div className="ownmatches-header">
          <h1 className="ownmatches-title">My active games</h1>
          <button
            className="own-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`own-refreshIcon ${refreshing ? "spinning" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Grid */}
        <div className="ownmatches-grid">
          {matches.map((m) => (
            <div key={m.id} className="own-card">
              <div className="own-cardContent">
                <div className="own-cardHeader">
                  <h3 className="own-cardName">{m.name}</h3>
                </div>

                <div className="own-creator">
                  <User className="own-creatorIcon" />
                  <span className="own-creatorText">
                    Created by: <strong>{m.creator}</strong>
                  </span>
                </div>

                <div className="own-playersRow">
                  <div className="own-playersCount">
                    <Users className="own-playersIcon" />
                    <span className="own-playersText">
                      {m.currentPlayers}{" "}
                      {m.currentPlayers === 1 ? "player" : "players"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenMatch(m.id)}
                  disabled={!m.canJoin}
                  className={`own-joinBtn ${
                    m.canJoin ? "own-joinEnabled" : "own-joinDisabled"
                  }`}
                >
                  {m.canJoin ? (
                    <>
                      <Play className="own-btnIcon" />
                      Open game
                    </>
                  ) : (
                    <>
                      <Clock className="own-btnIcon" />
                      Game is full
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {matches.length === 0 && (
          <div className="own-empty">
            <div className="own-emptyIcon">🎮</div>
            <h3 className="own-emptyTitle">You have no active games</h3>
          </div>
        )}
      </div>
    </div>
  );
}
