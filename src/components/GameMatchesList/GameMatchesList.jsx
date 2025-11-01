// GameMatchesList.jsx

/**
 * @file GameMatchesList.jsx
 * @description Public lobby: fetches and lists available games to join. Allows manual refresh and navigation to /join/:gameId.
 * Props: none (this component does not accept props).
 *
 * API: GET http://localhost:8000/games?activeGames=false
 * Expected response item shape (subset used here):
 * {
 *   gameId: string|number,
 *   gameName: string,
 *   ownerName: string,
 *   minPlayers: number,
 *   maxPlayers: number,
 *   actualPlayers: number
 * }
 */

/**
 * @typedef {Object} Match
 * @property {string|number} id
 * @property {string} name
 * @property {string} creator
 * @property {number} minPlayers
 * @property {number} maxPlayers
 * @property {number} currentPlayers
 */

import React, { useState, useEffect } from "react";
import { Users, User, Clock, Play, RefreshCw } from "lucide-react";
import "./GameMatchesList.css";
import { useNavigate } from "react-router-dom";

const apiGamesList = "http://localhost:8000/games?activeGames=false";

const GameMatchesList = () => {
  /** @type {[Match[], React.Dispatch<React.SetStateAction<Match[]>>]} */
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const navigate = useNavigate();

  /**
   * Fetch games from the server.
   * @param {boolean} isRefresh - When true, shows the smaller "refreshing" state instead of the full-page loader.
   */
  const fetchMatches = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch(apiGamesList, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

      const data = await response.json();

      // Normalize API items to the local Match shape used by the UI
      const mappedData = data.map((game) => ({
        id: game.gameId,
        name: game.gameName,
        creator: game.ownerName,
        minPlayers: game.minPlayers,
        maxPlayers: game.maxPlayers,
        currentPlayers: game.actualPlayers,
      }));

      setMatches(mappedData);
    } catch (error) {
      console.error("Error fetching matches:", error);
      setMatches([]); // keep UI consistent on failure
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  // Initial load on mount
  useEffect(() => {
    fetchMatches(false);
  }, []);

  /**
   * Compute status styling + whether joining is allowed for a card.
   * @param {Match} match
   */
  const getMatchStatus = (match) => {
    const { currentPlayers, minPlayers, maxPlayers } = match;

    if (currentPlayers >= maxPlayers) {
      return { color: "status-red", status: "", canJoin: false, icon: "🔴" };
    } else if (currentPlayers >= minPlayers) {
      return { color: "status-yellow", status: "", canJoin: true, icon: "🟡" };
    } else {
      return { color: "status-green", status: "", canJoin: true, icon: "🟢" };
    }
  };

  // Trigger a light refresh (keeps page context)
  const handleRefresh = () => {
    fetchMatches(true);
  };

  // Navigate to the join screen for the selected match
  const handleJoinMatch = (matchId) => {
    console.log(`Trying to join the game ${matchId}`);
    navigate(`/join/${matchId}`);
  };

  // Full-page loading state
  if (loading) {
    return (
      <div
        className="loading-container"
        style={{
          background: `url('/Assets/background_pregame.jpg') no-repeat center center fixed`,
          backgroundSize: "cover",
        }}
      >
        <div className="loading-spinner"></div>
        <span className="loading-text">Loading games...</span>
      </div>
    );
  }

  return (
    <div
      className="matches-container"
      style={{
        background: `url('/Assets/background_pregame.jpg') no-repeat center center fixed`,
        backgroundSize: "cover",
      }}
    >
      <div className="matches-wrapper">
        {/* Header: title + manual refresh */}
        <div className="matches-header">
          <h1 className="matches-title">List of games</h1>
          <button
            className="refresh-button"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`refresh-icon ${refreshing ? "spinning" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Cards grid */}
        <div className="matches-grid">
          {matches.map((match) => {
            const status = getMatchStatus(match);

            return (
              <div key={match.id} className="match-card">
                <div className="match-content">
                  {/* Name + status pill */}
                  <div className="match-header">
                    <h3 className="match-name">{match.name}</h3>
                    <span className={`match-status ${status.color}`}>
                      {status.icon} {status.status}
                    </span>
                  </div>

                  {/* Creator */}
                  <div className="match-creator">
                    <User className="creator-icon" />
                    <span className="creator-text">
                      Created by: <strong>{match.creator}</strong>
                    </span>
                  </div>

                  {/* Players count */}
                  <div className="match-players-info">
                    <div className="players-count">
                      <Users className="players-icon" />
                      <span className="players-text">
                        {match.currentPlayers}/{match.maxPlayers} players
                      </span>
                    </div>
                  </div>

                  {/* Occupancy progress bar */}
                  <div className="progress-section">
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${
                          match.currentPlayers >= match.maxPlayers
                            ? "progress-red"
                            : match.currentPlayers >= match.minPlayers
                            ? "progress-yellow"
                            : "progress-green"
                        }`}
                        style={{
                          width: `${
                            (match.currentPlayers / match.maxPlayers) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="progress-labels">
                      <span>Min: {match.minPlayers}</span>
                      <span>Max: {match.maxPlayers}</span>
                    </div>
                  </div>

                  {/* Call to action */}
                  <button
                    onClick={() => handleJoinMatch(match.id)}
                    disabled={!status.canJoin}
                    className={`join-button ${
                      status.canJoin
                        ? "join-button-enabled"
                        : "join-button-disabled"
                    }`}
                  >
                    {status.canJoin ? (
                      <>
                        <Play className="button-icon" />
                        Join Game
                      </>
                    ) : (
                      <>
                        <Clock className="button-icon" />
                        Game is full
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {matches.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🎮</div>
            <h3 className="empty-title">There are no available games</h3>
          </div>
        )}

        {/* Legend */}
        <div className="legend-container">
          <h4 className="legend-title">Statuses:</h4>
          <div className="legend-grid">
            <div className="legend-item">
              <span className="legend-dot legend-dot-green"></span>
              <span>
                {" "}
                Waiting for players <br /> (can join, minimum not reached)
              </span>
            </div>
            <div className="legend-item">
              <span className="legend-dot legend-dot-yellow"></span>
              <span>
                {" "}
                Ready to play <br /> (can join, minimum reached)
              </span>
            </div>
            <div className="legend-item">
              <span className="legend-dot legend-dot-red"></span>
              <span>
                {" "}
                Game full <br /> (can't join)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameMatchesList;
