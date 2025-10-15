// NotifierTest.jsx
import React, { useState, useRef } from 'react';
import Notifier from './Notifier'; // Adjust path as needed

// Mock public data for testing
const mockPublicData = {
  actionStatus: "inProgress",
  gameStatus: "inProgress",
  regularDeckCount: 30,
  discardPileTop: {
    id: 1,
    name: "Not so Fast!"
  },
  draftCards: [
    { id: 2, name: "Hercule Poirot" },
    { id: 3, name: "Miss Marple" }
  ],
  discardPileCount: 5,
  players: [
    {
      id: 1,
      name: "Alice",
      avatar: 1,
      socialDisgrace: false,
      turnOrder: 1,
      turnStatus: "waiting",
      cardCount: 5,
      secrets: [
        { id: 101, revealed: false }, // Alice's hidden secret
        { id: 102, revealed: true, name: "You are the murderer" } // Alice's revealed secret
      ],
      sets: [
        {
          setId: 1,
          setName: "Tommy Beresford",
          cards: [
            { id: 4, name: "Hercule Poirot" },
            { id: 5, name: "Not so Fast!" }
          ]
        }
      ]
    },
    {
      id: 2,
      name: "Bob",
      avatar: 2,
      socialDisgrace: true,
      turnOrder: 2,
      turnStatus: "playing",
      cardCount: 3,
      secrets: [
        { id: 103, revealed: false }, // Bob's hidden secret
        { id: 104, revealed: true, name: "Just a Fantasy" } // Bob's revealed secret
      ],
      sets: [
        {
          setId: 2,
          setName: "Miss Marple",
          cards: [
            { id: 6, name: "Miss Marple" },
            { id: 7, name: "Cards off the table" }
          ]
        }
      ]
    },
    {
      id: 3,
      name: "Charlie",
      avatar: 3,
      socialDisgrace: false,
      turnOrder: 3,
      turnStatus: "discarding",
      cardCount: 4,
      secrets: [
        { id: 105, revealed: false }, // Charlie's hidden secret
        { id: 106, revealed: true, name: "Untouched" } // Charlie's revealed secret
      ],
      sets: [
        {
          setId: 3,
          setName: "Tommy Beresford",
          cards: [
            { id: 8, name: "Tommy Beresford" }
          ]
        }
      ]
    }
  ]
};

export default function NotifierTest() {
  const [wsMessages, setWsMessages] = useState([]);
  const wsRef = useRef({
    addEventListener: (type, handler) => {
      // Store the handler to simulate receiving messages
      if (type === 'message') {
        wsRef.current.messageHandler = handler;
      }
    },
    removeEventListener: () => {},
    messageHandler: null
  });

  // Function to simulate receiving a WebSocket message
  const simulateWebSocketMessage = (eventData) => {
    const message = {
      data: JSON.stringify(eventData)
    };
    
    if (wsRef.current.messageHandler) {
      wsRef.current.messageHandler(message);
    }
    
    // Add to message log
    setWsMessages(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      event: eventData.event,
      payload: eventData.payload
    }]);
  };

  // Test events with example values - all IDs match actual players and secrets
  const testEvents = {
    cardsOffTheTableSelf: {
      event: "notifierCardsOffTheTable",
      payload: {
        playerID: 1, // Alice targets herself
        quantity: 2,
        selectedPlayerId: 1 // Alice
      }
    },
    cardsOffTheTableOther: {
      event: "notifierCardsOffTheTable",
      payload: {
        playerID: 1, // Alice targets Bob
        quantity: 2,
        selectedPlayerId: 2 // Bob
      }
    },
    stealSet: {
      event: "notifierStealSet",
      payload: {
        playerID: 2, // Bob steals from Alice
        stolenPlayerId: 1, // Alice
        setId: 1 // Alice's set
      }
    },
    lookIntoTheAshes: {
      event: "notifierLookIntoTheAshes",
      payload: {
        playerID: 3 // Charlie
      }
    },
    andThenThereWasOneMoreSelfToSelf: {
      event: "notifierAndThenThereWasOneMore",
      payload: {
        playerID: 1, // Alice takes from herself
        secretId: 101, // Alice's secret
        secretName: "You are the murderer",
        stolenPlayerId: 1, // Alice
        giftedPlayerId: 1 // Alice
      }
    },
    andThenThereWasOneMoreSelfToOther: {
      event: "notifierAndThenThereWasOneMore",
      payload: {
        playerID: 1, // Alice takes from herself
        secretId: 101, // Alice's secret
        secretName: "You are the murderer",
        stolenPlayerId: 1, // Alice
        giftedPlayerId: 2 // Bob
      }
    },
    andThenThereWasOneMoreOtherToSelf: {
      event: "notifierAndThenThereWasOneMore",
      payload: {
        playerID: 2, // Bob takes from Alice
        secretId: 101, // Alice's secret
        secretName: "You are the murderer",
        stolenPlayerId: 1, // Alice
        giftedPlayerId: 2 // Bob
      }
    },
    andThenThereWasOneMoreOtherBackToSame: {
      event: "notifierAndThenThereWasOneMore",
      payload: {
        playerID: 3, // Charlie takes from Bob
        secretId: 103, // Bob's secret
        secretName: "Just a Fantasy",
        stolenPlayerId: 2, // Bob
        giftedPlayerId: 2 // Bob (back to same person)
      }
    },
    andThenThereWasOneMoreOtherToThird: {
      event: "notifierAndThenThereWasOneMore",
      payload: {
        playerID: 1, // Alice takes from Bob
        secretId: 103, // Bob's secret
        secretName: "Just a Fantasy",
        stolenPlayerId: 2, // Bob
        giftedPlayerId: 3 // Charlie
      }
    },
    revealSecretSelf: {
      event: "notifierRevealSecret",
      payload: {
        playerID: 1, // Alice reveals her own secret
        secretId: 101, // Alice's secret
        selectedPlayerId: 1 // Alice
      }
    },
    revealSecretOther: {
      event: "notifierRevealSecret",
      payload: {
        playerID: 2, // Bob reveals Alice's secret
        secretId: 101, // Alice's secret
        selectedPlayerId: 1 // Alice
      }
    },
    revealSecretForceSelf: {
      event: "notifierRevealSecretForce",
      payload: {
        playerID: 1, // Alice forces her own secret
        secretId: 101, // Alice's secret
        selectedPlayerId: 1 // Alice
      }
    },
    revealSecretForceOther: {
      event: "notifierRevealSecretForce",
      payload: {
        playerID: 2, // Bob forces Alice's secret
        secretId: 101, // Alice's secret
        selectedPlayerId: 1 // Alice
      }
    },
    satterthwaiteWildSelf: {
      event: "notifierSatterthwaiteWild",
      payload: {
        playerID: 1, // Alice uses on herself
        secretId: 101, // Alice's secret
        secretName: "You are the murderer",
        selectedPlayerId: 1 // Alice
      }
    },
    satterthwaiteWildOther: {
      event: "notifierSatterthwaiteWild",
      payload: {
        playerID: 2, // Bob uses on Alice
        secretId: 101, // Alice's secret
        secretName: "You are the murderer",
        selectedPlayerId: 1 // Alice
      }
    },
    hideSecretSelf: {
      event: "notifierHideSecret",
      payload: {
        playerID: 1, // Alice hides her own secret
        secretId: 101, // Alice's secret
        selectedPlayerId: 1 // Alice
      }
    },
    hideSecretOther: {
      event: "notifierHideSecret",
      payload: {
        playerID: 2, // Bob hides Alice's secret
        secretId: 101, // Alice's secret
        selectedPlayerId: 1 // Alice
      }
    },
    delayTheMurderersEscape: {
      event: "notifierDelayTheMurderersEscape",
      payload: {
        playerID: 2, // Bob uses Delay the Murderer's Escape
      }
    },
    noEffect: {
      event: "notifierNoEffect",
      payload: {} // No payload needed for noEffect
    },
    cardsPlayedSet: {
      event: "cardsPlayed",
      payload: {
        playerId: 1, // Alice plays
        cards: [
          { id: 4, name: "Hercule Poirot" },
          { id: 5, name: "Not so Fast!" }
        ],
        actionType: "set"
      }
    },
    cardsPlayedDetective: {
      event: "cardsPlayed",
      payload: {
        playerId: 2, // Bob plays
        cards: [
          { id: 9, name: "Mr Satterthwaite" }
        ],
        actionType: "detective"
      }
    },
    cardsPlayedEvent: {
      event: "cardsPlayed",
      payload: {
        playerId: 3, // Charlie plays
        cards: [
          { id: 10, name: "Cards off the table" }
        ],
        actionType: "event"
      }
    },
    discardEvent: {
      event: "discardEvent",
      payload: {
        playerId: 1, // Alice discards
        cards: [
          { id: 11, name: "Another Victim" },
          { id: 12, name: "Dead Card Folly" }
        ]
      }
    },
    stealSetWithImage: {
      event: "notifierStealSet",
      payload: {
        playerID: 3, // Charlie steals from Alice
        stolenPlayerId: 1, // Alice
        setId: 1 // Alice's Tommy Beresford set
      }
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Notifier Test Panel</h1>
      <p>Current Player ID: 1 (Alice)</p>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>Test Events</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
          {Object.entries(testEvents).map(([name, eventData]) => (
            <button
              key={name}
              onClick={() => simulateWebSocketMessage(eventData)}
              style={{
                padding: '10px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Test: {name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Message Log</h2>
        <div style={{ 
          border: '1px solid #ccc', 
          padding: '10px', 
          maxHeight: '200px', 
          overflowY: 'auto',
          backgroundColor: '#f5f5f5'
        }}>
          {wsMessages.length === 0 ? (
            <p>No messages yet. Click test buttons above.</p>
          ) : (
            wsMessages.map((msg, index) => (
              <div key={index} style={{ 
                marginBottom: '5px', 
                padding: '5px', 
                borderBottom: '1px solid #ddd',
                fontSize: '12px'
              }}>
                <strong>[{msg.timestamp}]</strong> {msg.event}
                <pre style={{ margin: '5px 0', fontSize: '10px' }}>
                  {JSON.stringify(msg.payload, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Current Public Data</h2>
        <details>
          <summary>View Public Data Structure</summary>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '5px',
            fontSize: '12px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {JSON.stringify(mockPublicData, null, 2)}
          </pre>
        </details>
      </div>

      {/* The actual Notifier component */}
      <Notifier
        publicData={mockPublicData}
        actualPlayerId={1} // Testing as Alice
        wsRef={wsRef}
      />

      <div style={{ 
        backgroundColor: '#e7f3ff', 
        padding: '15px', 
        borderRadius: '5px',
        border: '1px solid #b3d9ff'
      }}>
        <h3>Testing Instructions:</h3>
        <ol>
          <li>Click any test button to simulate a WebSocket message</li>
          <li>The Notifier will display an overlay with the event information</li>
          <li>Click anywhere on the overlay to close it</li>
          <li>Check the message log to see all sent events</li>
          <li><strong>All events now use valid player and secret IDs</strong></li>
        </ol>
        <p><strong>New Events Added:</strong></p>
        <ul>
          <li><strong>delayTheMurderersEscape</strong> - Shows when a player uses "Delay the Murderer's Escape"</li>
          <li><strong>noEffect</strong> - Shows "Nothing happened" notification</li>
        </ul>
        <p><strong>Note:</strong> The Notifier overlay will appear above this test panel when an event is triggered.</p>
      </div>
    </div>
  );
}