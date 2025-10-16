import { BrowserRouter, Routes, Route } from "react-router-dom";
import TitleScreen from "../../components/PreGameScreen/TitleScreen/TitleScreen";
import CreateGameScreen from "../../components/PreGameScreen/CreateGameScreen/CreateGameScreen";
import JoinGameScreen from "../../components/PreGameScreen/JoinGameScreen/JoinGameScreen";
import GameMatchesList from "../../components/GameMatchesList/GameMatchesList";
import GameScreen from "../../components/GameScreen/GameScreen";
import SyncOrchestrator from "../../components/Sync/SyncOrchestrator";
import SetsGrid from "../../components/Board/SetsGrid/SetsGrid";

function App() {
  const currentPlayerId = 1;

  // --- Public game state (visible to everyone) ---
  const publicData = {
    actionStatus: "unblocked",
    gameStatus: "inProgress",
    regularDeckCount: 37,
    discardPileTop: { id: 700, name: "Another Victim" }, // in CARDS_MAP
    draftCards: [
      { id: 301, name: "Look in to the Ashes" }, // in CARDS_MAP
      { id: 302, name: "Not so Fast!" }, // in CARDS_MAP
      { id: 303, name: "Point Your Suspicions" }, // in CARDS_MAP
    ],
    discardPileCount: 5,
    players: [
      {
        id: 1,
        name: "Player A",
        avatar: 1,
        turnOrder: 1,
        turnStatus: "discarding",
        cardCount: 3,
        // Public secrets: keep name null unless revealed === true
        secrets: [{ id: 201, revealed: false, name: null }],
        // Example set that matches SETS_MAP and uses card names from CARDS_MAP
        sets: [
          {
            setName: "Tommy Beresford",
            cards: [
              { id: 101, name: "Tommy Beresford" },
              { id: 102, name: "Tuppence Beresford" },
            ],
          },
          { setName: "Miss Marple", cards: [{ id: 103, name: "Miss Marple" }] },
          {
            setName: "Lady Eileen Brent",
            cards: [{ id: 104, name: "Lady Eileen Brent" }],
          },
          {
            setName: "Hercule Poirot",
            cards: [{ id: 105, name: "Hercule Poirot" }],
          },
          
        ],
      },
      {
        id: 2,
        name: "Player B",
        avatar: 2,
        turnOrder: 2,
        turnStatus: "playing",
        cardCount: 4,
        // Publicly revealed secret to test UI
        secrets: [
          { id: 201, revealed: false, name: null },
          { id: 901, revealed: false, name: "You are the accomplice" },
          { id: 902, revealed: false, name: "Prankster" },
          { id: 903, revealed: false, name: "Prankster" },
          { id: 904, revealed: false, name: "Prankster" },
          { id: 905, revealed: false, name: "Prankster" },
          { id: 906, revealed: false, name: "Prankster" },
          { id: 907, revealed: false, name: "Prankster" },
          { id: 908, revealed: false, name: "Prankster" },
          { id: 909, revealed: false, name: "Prankster" },
          { id: 910, revealed: false, name: "Prankster" },
        ], // in SECRETS_MAP
        sets: [
          {
            setName: "Tommy Beresford",
            cards: [
              { id: 101, name: "Tommy Beresford" },
              { id: 102, name: "Tuppence Beresford" },
            ],
          },
          { setName: "Miss Marple", cards: [{ id: 103, name: "Miss Marple" }] },
          {
            setName: "Lady Eileen Brent",
            cards: [{ id: 104, name: "Lady Eileen Brent" }],
          },
          {
            setName: "Hercule Poirot",
            cards: [{ id: 105, name: "Hercule Poirot" }],
          },
          
        ],
      },
      {
        id: 3,
        name: "Player C",
        avatar: 3,
        turnOrder: 3,
        turnStatus: "dr",
        cardCount: 2,
        secrets: [{ id: 203, revealed: false, name: null }],
        sets: [
          {
            setName: "Tommy Beresford",
            cards: [
              { id: 101, name: "Tommy Beresford" },
              { id: 102, name: "Tuppence Beresford" },
            ],
          },
          { setName: "Miss Marple", cards: [{ id: 103, name: "Miss Marple" }] },

          
        ],
      },
      {
        id: 4,
        name: "Player D",
        avatar: 4,
        turnOrder: 4,
        turnStatus: "waiting",
        cardCount: 3,
        secrets: [{ id: 204, revealed: false, name: null }],
        sets: [
          {
            setName: "Tommy Beresford",
            cards: [
              { id: 101, name: "Tommy Beresford" },
              { id: 102, name: "Tuppence Beresford" },
            ],
          },
          { setName: "Miss Marple", cards: [{ id: 103, name: "Miss Marple" }] },
          {
            setName: "Lady Eileen Brent",
            cards: [{ id: 104, name: "Lady Eileen Brent" }],
          },
          {
            setName: "Hercule Poirot",
            cards: [{ id: 105, name: "Hercule Poirot" }],
          },
          
        ],
      },
      {
        id: 5,
        name: "Player E",
        avatar: 5,
        turnOrder: 5,
        turnStatus: "waiting",
        cardCount: 5,
        secrets: [
          { id: 201, revealed: false, name: null },
          { id: 901, revealed: false, name: "You are the accomplice" },
          { id: 902, revealed: false, name: "Prankster" },
          { id: 903, revealed: false, name: "Prankster" },
          { id: 904, revealed: false, name: "Prankster" },
          { id: 905, revealed: false, name: "Prankster" },
          { id: 906, revealed: false, name: "Prankster" },
          { id: 907, revealed: false, name: "Prankster" },
          { id: 908, revealed: false, name: "Prankster" },
          { id: 909, revealed: false, name: "Prankster" },
          { id: 910, revealed: false, name: "Prankster" },
        ],
        sets: [
          {
            setName: "Tommy Beresford",
            cards: [
              { id: 101, name: "Tommy Beresford" },
              { id: 102, name: "Tuppence Beresford" },
            ],
          },
          { setName: "Miss Marple", cards: [{ id: 103, name: "Miss Marple" }] },
          {
            setName: "Lady Eileen Brent",
            cards: [{ id: 104, name: "Lady Eileen Brent" }],
          },
          {
            setName: "Hercule Poirot",
            cards: [{ id: 105, name: "Hercule Poirot" }],
          },
          {
            setName: "Lady Eileen Brent",
            cards: [{ id: 104, name: "Lady Eileen Brent" }],
          },
          {
            setName: "Hercule Poirot",
            cards: [{ id: 105, name: "Hercule Poirot" }],
          },


          
          
        ],
      },
      {
        id: 6,
        name: "Player F",
        avatar: 6,
        turnOrder: 6,
        turnStatus: "waiting",
        cardCount: 1,
        secrets: [
          { id: 201, revealed: false, name: null },
          { id: 901, revealed: false, name: "You are the accomplice" },
          { id: 902, revealed: false, name: "Prankster" },
          { id: 903, revealed: false, name: "Prankster" },
          { id: 904, revealed: false, name: "Prankster" },
          { id: 905, revealed: false, name: "Prankster" },
          { id: 906, revealed: false, name: "Prankster" },
          { id: 907, revealed: false, name: "Prankster" },
          { id: 908, revealed: false, name: "Prankster" },
          { id: 909, revealed: false, name: "Prankster" },
          { id: 910, revealed: false, name: "Prankster" },
        ],
        sets: [
          {
            setName: "Tommy Beresford",
            cards: [
              { id: 101, name: "Tommy Beresford" },
              { id: 102, name: "Tuppence Beresford" },
            ],
          },
          {
            setName: "Tommy Beresford",
            cards: [
              { id: 101, name: "Tommy Beresford" },
              { id: 102, name: "Tuppence Beresford" },
            ],
          },
          {
            setName: "Tommy Beresford",
            cards: [
              { id: 101, name: "Tommy Beresford" },
              { id: 102, name: "Tuppence Beresford" },
            ],
          },
          {
            setName: "Tommy Beresford",
            cards: [
              { id: 101, name: "Tommy Beresford" },
              { id: 102, name: "Tuppence Beresford" },
            ],
          },
          {
            setName: "Tommy Beresford",
            cards: [
              { id: 101, name: "Tommy Beresford" },
              { id: 102, name: "Tuppence Beresford" },
            ],
          },

        ],
      },
    ],
  };

  // --- Private state for current player (only "me" can see this) ---
  const privateData = {
    // Role/ally help the Board render hidden info correctly
    role: "accomplice",
    ally: { id: 2, role: "murderer" },

    // My hand (card names must exist in CARDS_MAP). "type" is free-form enum.
    cards: [
      { id: 401, name: "Hercule Poirot", type: "detective" },
      { id: 402, name: "Card Trade", type: "event" },
      { id: 403, name: "Not so Fast!", type: "instant" },
      { id: 404, name: "Another Victim", type: "victim" },
      { id: 405, name: "Point Your Suspicions", type: "event" },
      { id: 406, name: "Look in to the Ashes", type: "event" },
    ],

    // My secrets (names must exist in SECRETS_MAP).
    // Include both "revealed" and "reveled" to be resilient to typos.
    secrets: [
      { id: 201, revealed: false, name: null },
      { id: 901, revealed: false, name: "You are the accomplice" },
      { id: 902, revealed: false, name: "Prankster" },
      { id: 903, revealed: false, name: "Prankster" },
      { id: 904, revealed: false, name: "Prankster" },
      { id: 905, revealed: false, name: "Prankster" },
      { id: 906, revealed: false, name: "Prankster" },
      { id: 907, revealed: false, name: "Prankster" },
      { id: 908, revealed: false, name: "Prankster" },
      { id: 909, revealed: false, name: "Prankster" },
      { id: 910, revealed: false, name: "Prankster" },
    ],
  };

  const sampleSets = [
    {
      setId: 1,
      setName: "Hercule Poirot",
      cards: [{ id: 1, name: "Hercule Poirot" }],
    },
    {
      setId: 2,
      setName: "Miss Marple",
      cards: [{ id: 2, name: "Miss Marple" }],
    },

  ];
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TitleScreen />} />
        <Route path="/create" element={<SetsGrid sets={sampleSets} position="vertical-right" />} />
        <Route
          path="/join"
          element={
            <SyncOrchestrator
              publicData={publicData}
              privateData={privateData}
              currentPlayerId={currentPlayerId}
            />
          }
        />
        <Route path="/join/:gameId" element={<JoinGameScreen />} />
        <Route path="/game/:gameId" element={<GameScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
