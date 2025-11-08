import React, { useState, useRef, useEffect } from "react";
import Notifier from "./Notifier";

export default function NotifierTester() {
  const wsRef = useRef(null);
  const [publicData, setPublicData] = useState(null);
  const [actualPlayerId, setActualPlayerId] = useState(1);

  // Datos de ejemplo
  const mockPublicData = {
    actionStatus: "unblocked",
    gameStatus: "inProgress",
    regularDeckCount: 45,
    discardPileTop: {
      id: 1,
      name: "Not so Fast!"
    },
    draftCards: [],
    discardPileCount: 5,
    players: [
      {
        id: 1,
        name: "Alice",
        avatar: 1,
        socialDisgrace: false,
        turnOrder: 1,
        turnStatus: "playing",
        cardCount: 5,
        secrets: [
          {
            id: 1,
            revealed: true,
            name: "You are the murderer"
          },
          {
            id: 2,
            revealed: false,
            name: "Prankster"
          }
        ],
        sets: [
          {
            setId: 1,
            setName: "Hercule Poirot",
            cards: [
              { id: 10, name: "Hercule Poirot" },
              { id: 11, name: "Hercule Poirot" },
              { id: 12, name: "Hercule Poirot" }
            ]
          }
        ]
      },
      {
        id: 2,
        name: "Bob",
        avatar: 2,
        socialDisgrace: false,
        turnOrder: 2,
        turnStatus: "waiting",
        cardCount: 6,
        secrets: [
          {
            id: 3,
            revealed: true,
            name: "You are the accomplice"
          },
          {
            id: 4,
            revealed: false,
            name: "Secret Hate"
          }
        ],
        sets: [
          {
            setId: 2,
            setName: "Miss Marple",
            cards: [
              { id: 20, name: "Miss Marple" },
              { id: 21, name: "Miss Marple" }
            ]
          }
        ]
      },
      {
        id: 3,
        name: "Charlie",
        avatar: 3,
        socialDisgrace: true,
        turnOrder: 3,
        turnStatus: "waiting",
        cardCount: 4,
        secrets: [
          {
            id: 5,
            revealed: false,
            name: "Impostor"
          },
          {
            id: 6,
            revealed: true,
            name: "Faked Dead"
          }
        ],
        sets: [
          {
            setId: 3,
            setName: "Tommy Beresford",
            cards: [
              { id: 30, name: "Tommy Beresford" },
              { id: 31, name: "Tuppence Beresford" }
            ]
          }
        ]
      },
      {
        id: 4,
        name: "Diana",
        avatar: 4,
        socialDisgrace: false,
        turnOrder: 4,
        turnStatus: "waiting",
        cardCount: 7,
        secrets: [
          {
            id: 7,
            revealed: false,
            name: "Just a Fantasy"
          },
          {
            id: 8,
            revealed: false,
            name: "Untouched"
          }
        ],
        sets: []
      }
    ]
  };

  // Eventos de prueba
  const testEvents = [
    {
      name: "Cards Off The Table",
      event: "notifierCardsOffTheTable",
      payload: { playerId: 2, quantity: 2, selectedPlayerId: 1 }
    },
    {
      name: "Cards Off The Table (self)",
      event: "notifierCardsOffTheTable",
      payload: { playerId: 1, quantity: 3, selectedPlayerId: 1 }
    },
    {
      name: "Steal Set",
      event: "notifierStealSet",
      payload: { playerId: 1, stolenPlayerId: 2, setId: 2 }
    },
    {
      name: "Look Into The Ashes",
      event: "notifierLookIntoTheAshes",
      payload: { playerId: 3 }
    },
    {
      name: "And Then There Was One More (self hide)",
      event: "notifierAndThenThereWasOneMore",
      payload: {
        playerId: 1,
        secretId: 1,
        secretName: "You are the murderer",
        stolenPlayerId: 1,
        giftedPlayerId: 1
      }
    },
    {
      name: "And Then There Was One More (gift)",
      event: "notifierAndThenThereWasOneMore",
      payload: {
        playerId: 2,
        secretId: 3,
        secretName: "You are the accomplice",
        stolenPlayerId: 2,
        giftedPlayerId: 3
      }
    },
    {
      name: "Reveal Secret (self)",
      event: "notifierRevealSecret",
      payload: { playerId: 1, secretId: 1, selectedPlayerId: 1 }
    },
    {
      name: "Reveal Secret (other)",
      event: "notifierRevealSecret",
      payload: { playerId: 2, secretId: 4, selectedPlayerId: 2 }
    },
    {
      name: "Reveal Secret Force",
      event: "notifierRevealSecretForce",
      payload: { playerId: 3, secretId: 5, selectedPlayerId: 4 }
    },
    {
      name: "Satterthwaite Wild (self)",
      event: "notifierSatterthwaiteWild",
      payload: {
        playerId: 1,
        secretId: 2,
        secretName: "Prankster",
        selectedPlayerId: 1
      }
    },
    {
      name: "Satterthwaite Wild (steal)",
      event: "notifierSatterthwaiteWild",
      payload: {
        playerId: 2,
        secretId: 6,
        secretName: "Faked Dead",
        selectedPlayerId: 3
      }
    },
    {
      name: "Hide Secret (self)",
      event: "notifierHideSecret",
      payload: { playerId: 1, secretId: 1, selectedPlayerId: 1 }
    },
    {
      name: "Hide Secret (other)",
      event: "notifierHideSecret",
      payload: { playerId: 2, secretId: 6, selectedPlayerId: 3 }
    },
    {
      name: "Delay Murderer's Escape",
      event: "notifierDelayTheMurderersEscape",
      payload: { playerId: 4 }
    },
    {
      name: "Cards Played (set)",
      event: "cardsPlayed",
      payload: {
        playerId: 1,
        actionType: "set",
        cards: [
          { id: 10, name: "Hercule Poirot" },
          { id: 11, name: "Hercule Poirot" },
          { id: 12, name: "Hercule Poirot" }
        ]
      }
    },
    {
      name: "Cards Played (detective)",
      event: "cardsPlayed",
      payload: {
        playerId: 2,
        actionType: "detective",
        cards: [{ id: 20, name: "Miss Marple" }],
        setOwnerId: 1
      }
    },
    {
      name: "Cards Played (event)",
      event: "cardsPlayed",
      payload: {
        playerId: 3,
        actionType: "event",
        cards: [{ id: 40, name: "Look in to the Ashes" }]
      }
    },
    {
      name: "Cards Played (instant)",
      event: "cardsPlayed",
      payload: {
        playerId: 4,
        actionType: "instant",
        cards: [{ id: 50, name: "Not so Fast!" }]
      }
    },
    {
      name: "Discard Event",
      event: "discardEvent",
      payload: {
        playerId: 4,
        cards: [
          { id: 50, name: "Not so Fast!" },
          { id: 51, name: "Card Trade" }
        ]
      }
    },
    {
      name: "No Effect",
      event: "notifierNoEffect",
      payload: {}
    },
    {
      name: "Card Trade (received)",
      event: "notifierCardTrade",
      payload: { playerId: 2, cardName: "Hercule Poirot" }
    },
    {
      name: "Card Trade Public",
      event: "notifierCardTradePublic",
      payload: { playerId: 2, selectedPlayerId: 3 }
    },
    {
      name: "Dead Card Folly",
      event: "notifierDeadCardFolly",
      payload: {}
    },
    {
      name: "Point Your Suspicious",
      event: "notifierPointYourSuspicious",
      payload: {
        playersSelections: [
          [1, 2],
          [2, 3],
          [3, 4]
        ],
        selectedPlayerId: 2
      }
    },
    {
      name: "Blackmailed Card",
      event: "notifierBlackmailedCard",
      payload: { playerId: 3, secretName: "Faked Dead" }
    },
    {
      name: "Blackmailed (as receiver)",
      event: "notifierBlackmailed",
      payload: { playerId: 2, selectedPlayerId: 1 }
    },
    {
      name: "Blackmailed (other players)",
      event: "notifierBlackmailed",
      payload: { playerId: 2, selectedPlayerId: 3 }
    },
    {
      name: "Faux Pass (as sender)",
      event: "notifierFauxPass",
      payload: { playerId: 1, selectedPlayerId: 3 }
    },
    {
      name: "Faux Pass (other players)",
      event: "notifierFauxPass",
      payload: { playerId: 2, selectedPlayerId: 4 }
    }
  ];

  // Inicializar mock WebSocket
  useEffect(() => {
    setPublicData(mockPublicData);

    // Crear un mock WebSocket
    const mockWs = {
      listeners: [],
      addEventListener: function(event, callback) {
        this.listeners.push(callback);
      },
      removeEventListener: function(event, callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
      },
      send: function(data) {
        // Simular recepción de mensaje
        const parsedData = JSON.parse(data);
        this.listeners.forEach(listener => {
          listener({ data: JSON.stringify(parsedData) });
        });
      }
    };

    wsRef.current = mockWs;
  }, []);

  // Función para enviar evento de prueba
  const sendTestEvent = (event, payload) => {
    if (wsRef.current) {
      const message = {
        event: event,
        payload: payload
      };
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return (
    <div style={{ 
      padding: "20px", 
      fontFamily: "Arial, sans-serif",
      backgroundColor: "#1a1a1a",
      minHeight: "100vh",
      color: "#fff"
    }}>
      <h1 style={{ marginBottom: "20px", color: "#f4e1a3" }}>
        Notifier Tester
      </h1>
      
      <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#2a2a2a", borderRadius: "8px" }}>
        <h3 style={{ marginBottom: "10px", color: "#f4e1a3" }}>
          Current Player ID: {actualPlayerId}
        </h3>
        <p style={{ fontSize: "14px", color: "#d1caa0" }}>
          Change this to test different player perspectives:
        </p>
        <select 
          value={actualPlayerId}
          onChange={(e) => setActualPlayerId(Number(e.target.value))}
          style={{
            padding: "8px 12px",
            fontSize: "16px",
            marginTop: "10px",
            backgroundColor: "#3a3a3a",
            color: "#fff",
            border: "2px solid #f4e1a3",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          <option value={1}>Alice (ID: 1)</option>
          <option value={2}>Bob (ID: 2)</option>
          <option value={3}>Charlie (ID: 3)</option>
          <option value={4}>Diana (ID: 4)</option>
        </select>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        gap: "15px"
      }}>
        {testEvents.map((test, index) => (
          <button
            key={index}
            onClick={() => sendTestEvent(test.event, test.payload)}
            style={{
              padding: "15px",
              fontSize: "14px",
              backgroundColor: "#3a3a3a",
              color: "#f4e1a3",
              border: "2px solid #f4e1a3",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s",
              fontWeight: "bold"
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#f4e1a3";
              e.target.style.color = "#1a1a1a";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#3a3a3a";
              e.target.style.color = "#f4e1a3";
            }}
          >
            {test.name}
          </button>
        ))}
      </div>

      <div style={{ 
        marginTop: "30px", 
        padding: "15px", 
        backgroundColor: "#2a2a2a", 
        borderRadius: "8px" 
      }}>
        <h3 style={{ marginBottom: "10px", color: "#f4e1a3" }}>
          Instructions:
        </h3>
        <ul style={{ fontSize: "14px", color: "#d1caa0", lineHeight: "1.6" }}>
          <li>Click any button to trigger a test notification</li>
          <li>Change the "Current Player ID" to see different perspectives</li>
          <li>Notifications will auto-close after 5 seconds</li>
          <li>Click outside the notification to close it manually</li>
        </ul>
      </div>

      {/* Notifier Component */}
      {publicData && wsRef.current && (
        <Notifier
          publicData={publicData}
          actualPlayerId={actualPlayerId}
          wsRef={wsRef}
        />
      )}
    </div>
  );
}