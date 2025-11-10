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
 *   actualPlayers: number,
 *   private: boolean
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
 * @property {boolean} private
 */

import React, { useState, useEffect } from "react";
import { Users, User, Clock, Play, RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import "./GameMatchesList.css";
import { useNavigate } from "react-router-dom";

const apiGamesList = "http://localhost:8000/games?activeGames=false";

const GameMatchesList = () => {
  /** @type {[Match[], React.Dispatch<React.SetStateAction<Match[]>>]} */
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [playerSort, setPlayerSort] = useState("none"); // "none", "asc", "desc"

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
        private: game.private,
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

  /**
   * Sort matches by player count based on current sort state
   * @param {Match[]} matchList - List of matches to sort
   * @param {string} sortType - "none", "asc", "desc"
   * @returns {Match[]} - Sorted matches
   */
  const sortMatchesByPlayers = (matchList, sortType) => {
    if (sortType === "none") {
      return matchList; // Return original order
    }

    return [...matchList].sort((a, b) => {
      if (sortType === "asc") {
        return a.currentPlayers - b.currentPlayers;
      } else if (sortType === "desc") {
        return b.currentPlayers - a.currentPlayers;
      }
      return 0;
    });
  };

  /**
   * Filter and sort matches based on search term and player sort
   * @param {Match[]} matchList - List of matches to filter
   * @param {string} term - Search term
   * @param {string} sortType - Player sort type
   * @returns {Match[]} - Filtered and sorted matches
   */
  const filterAndSortMatches = (matchList, term, sortType) => {
    let filtered = matchList;

    // First apply search filter if there's a search term
    if (term.trim()) {
      const lowerTerm = term.toLowerCase();
      
      filtered = matchList
        .filter(match => 
          match.name.toLowerCase().startsWith(lowerTerm) // Cambio: usar startsWith en lugar de includes
        )
        .sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          
          // Exact matches first
          if (aName === lowerTerm && bName !== lowerTerm) return -1;
          if (bName === lowerTerm && aName !== lowerTerm) return 1;
          
          // All matches already start with the term due to startsWith filter,
          // so just sort alphabetically
          return aName.localeCompare(bName);
        });
    }

    // Then apply player count sorting
    return sortMatchesByPlayers(filtered, sortType);
  };

  // Get filtered and sorted matches
  const filteredMatches = filterAndSortMatches(matches, searchTerm, playerSort);

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
    // Find the match to determine if it's private or public
    const match = matches.find(m => m.id === matchId);
        
    const routeType = match.private ? 'private' : 'public';
    console.log(`Trying to join the ${routeType} game ${matchId}`);
    navigate(`/join/${matchId}/${routeType}`);
  };

  /**
   * Handle search input change
   * @param {React.ChangeEvent<HTMLInputElement>} event
   */
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  /**
   * Handle player sort button click - cycles through none -> asc -> desc -> none
   */
  const handlePlayerSortClick = () => {
    setPlayerSort(prevSort => {
      if (prevSort === "none") return "asc";
      if (prevSort === "asc") return "desc";
      return "none";
    });
  };

  /**
   * Get sort button text and icon based on current sort state
   */
  const getSortButtonContent = () => {
    switch (playerSort) {
      case "asc":
        return { 
          text: "Player Count", 
          title: "Sorting: Less to More players",
          icon: <ArrowUp className="sort-arrow-icon" />
        };
      case "desc":
        return { 
          text: "Player Count", 
          title: "Sorting: More to Less players",
          icon: <ArrowDown className="sort-arrow-icon" />
        };
      default:
        return { 
          text: "Player Count", 
          title: "Click to sort by player count",
          icon: null
        };
    }
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
          
          {/* Search and Sort container */}
          <div className="search-sort-container">
            {/* Search input */}
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search games by name..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>

            {/* Player sort button */}
            <button
              className="sort-button"
              onClick={handlePlayerSortClick}
              title={getSortButtonContent().title}
            >
              <ArrowUpDown className="sort-icon" />
              {getSortButtonContent().text}
              {getSortButtonContent().icon}
            </button>
          </div>
        </div>

        {/* Cards grid */}
        <div className="matches-grid">
          {filteredMatches.map((match) => {
            const status = getMatchStatus(match);

            return (
              <div key={match.id} className="match-card">
                <div className="match-content">
                  {/* Private indicator */}
                  {match.private && (
                    <div className="private-indicator">
                      <span>Private</span>
                    </div>
                  )}
                  
                  {/* Name + status pill */}
                  <div className="match-header">
                    <h3 className="match-name">
                      {match.name}
                    </h3>
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
        {filteredMatches.length === 0 && matches.length > 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3 className="empty-title">No games found matching "{searchTerm}"</h3>
          </div>
        )}

        {filteredMatches.length === 0 && matches.length === 0 && (
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
            <div className="legend-item">
              <span style={{ fontSize: "16px" }}>🔒</span>
              <span>
                {" "}
                Private game <br /> (requires password)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameMatchesList;
