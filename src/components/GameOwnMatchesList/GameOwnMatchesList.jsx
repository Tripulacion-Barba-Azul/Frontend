import React, { useEffect, useState } from "react";
import { Users, User, Play, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./GameOwnMatchesList.css";

import { getCookie } from "../../utils/cookies";
import { filterOwnInProgress, parseOwnPairsMap } from "./ownGamesLogic";

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

// Debug tag for cleaner logs
const DTAG = "[GameOwnMatchesList]";

export default function GameOwnMatchesList() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ownPairsMap, setOwnPairsMap] = useState(() => new Map());

  const navigate = useNavigate();

  // -- Fetch & filter --------------------------------------------------------
  const fetchMatches = async (isRefresh = false) => {
    const startedAt = new Date();
    console.log(
      `${DTAG} fetchMatches(${isRefresh ? "refresh" : "initial"}) start`,
      { url: apiGamesList, at: startedAt.toISOString() }
    );

    try {
      isRefresh ? setRefreshing(true) : setLoading(true);

      // Request
      const res = await fetch(apiGamesList, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // in case backend reads cookies/session
      });
      console.log(`${DTAG} response`, { status: res.status, ok: res.ok });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Parse
      const data = await res.json();
      console.log(`${DTAG} raw games from API`, data);

      // Map server payload -> UI model; keep gameStatus for filtering
      const all = (Array.isArray(data) ? data : []).map((game) => ({
        id: game.gameId,
        name: game.gameName,
        creator: game.ownerName,
        minPlayers: game.minPlayers,
        maxPlayers: game.maxPlayers,
        currentPlayers: game.actualPlayers,
        gameStatus: game.gameStatus,
      }));
      console.log(`${DTAG} mapped games`, { count: all.length, all });

      // Cookie -> filter to own + inProgress and build gameId->playerId map
      const cookieRaw = getCookie(OWN_PAIRS_COOKIE);
      const cookieSnippet =
        typeof cookieRaw === "string" ? cookieRaw.slice(0, 200) : cookieRaw;
      console.log(`${DTAG} cookie read`, {
        name: OWN_PAIRS_COOKIE,
        length: cookieRaw?.length ?? 0,
        snippet: cookieSnippet,
      });

      const map = parseOwnPairsMap(cookieRaw);
      const entries = Array.from(map.entries());
      console.log(`${DTAG} ownPairsMap`, {
        size: map.size,
        entries: entries.slice(0, 20), // avoid huge logs
      });

      const ownActive = filterOwnInProgress(all, cookieRaw);
      console.log(`${DTAG} filtered own+inProgress`, {
        count: ownActive.length,
        ids: ownActive.map((g) => g.id),
        items: ownActive,
      });

      setMatches(ownActive);
      setOwnPairsMap(map);
    } catch (err) {
      console.error(`${DTAG} fetch error`, err);
      setMatches([]);
      setOwnPairsMap(new Map());
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
      const finishedAt = new Date();
      console.log(`${DTAG} fetchMatches end`, {
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      });
    }
  };
  // -------------------------------------------------------------------------

  // Initial mount
  useEffect(() => {
    console.log(`${DTAG} mount`);
    fetchMatches(false);
    return () => console.log(`${DTAG} unmount`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    console.log(`${DTAG} Refresh clicked`);
    fetchMatches(true);
  };

  // Navigate to /game/{gameId}?playerId={playerId}
  const handleOpenMatch = (matchId) => {
    const gid = Number(matchId);
    const pid = ownPairsMap.get(gid);
    const target =
      typeof pid === "number" && Number.isFinite(pid)
        ? `/game/${gid}?playerId=${pid}`
        : `/game/${gid}`;

    console.log(`${DTAG} Resume click`, {
      matchId,
      resolvedGameId: gid,
      playerIdFromCookie: pid,
      navigateTo: target,
    });

    navigate(target);
  };

  if (loading) {
    console.log(`${DTAG} render: loading`);
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

  console.log(`${DTAG} render: ready`, { matchCount: matches.length });

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

                {/* Always enabled: you already belong to all listed games */}
                <button
                  onClick={() => handleOpenMatch(m.id)}
                  className="own-joinBtn own-joinEnabled"
                >
                  <Play className="own-btnIcon" />
                  Resume game
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
