// Simple landing page without JSX to avoid Babel issues
function App() {
  const [gameState, setGameState] = React.useState({
    roomId: '',
    playerId: null,
    players: [],
    isLoading: false,
    error: ''
  });

  // Simple API client
  const apiClient = {
    createRoom: async (playerName) => {
      const response = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_name: playerName })
      });
      return response.json();
    },
    
    joinRoom: async (roomId, playerName) => {
      const response = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, player_name: playerName })
      });
      return response.json();
    }
  };

  const createRoom = async () => {
    setGameState(prev => ({ ...prev, isLoading: true, error: '' }));
    try {
      const playerName = prompt('Enter your name:');
      if (!playerName) {
        setGameState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      
      const response = await apiClient.createRoom(playerName);
      setGameState(prev => ({
        ...prev,
        roomId: response.room_id,
        playerId: response.player_id,
        players: [{ id: response.player_id, name: playerName }],
        isLoading: false
      }));
    } catch (err) {
      setGameState(prev => ({ 
        ...prev, 
        error: 'Failed to create room: ' + err.message,
        isLoading: false 
      }));
    }
  };

  const joinRoom = async () => {
    setGameState(prev => ({ ...prev, isLoading: true, error: '' }));
    try {
      const roomId = prompt('Enter room code:');
      const playerName = prompt('Enter your name:');
      if (!roomId || !playerName) {
        setGameState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      
      const response = await apiClient.joinRoom(roomId, playerName);
      setGameState(prev => ({
        ...prev,
        roomId: response.room_id,
        playerId: response.player_id,
        players: [...prev.players, { id: response.player_id, name: playerName }],
        isLoading: false
      }));
    } catch (err) {
      setGameState(prev => ({ 
        ...prev, 
        error: 'Failed to join room: ' + err.message,
        isLoading: false 
      }));
    }
  };

  // Create elements using React.createElement instead of JSX
  return React.createElement('div', {
    style: { 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }
  }, [
    // Header
    React.createElement('div', {
      key: 'header',
      style: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' }
    }, [
      React.createElement('header', {
        key: 'header-content',
        style: { textAlign: 'center', marginBottom: '3rem' }
      }, [
        React.createElement('h1', {
          key: 'title',
          style: { 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            marginBottom: '1rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }
        }, '🎮 Casino Card Game'),
        React.createElement('p', {
          key: 'subtitle',
          style: { 
            fontSize: '1.2rem', 
            opacity: 0.9,
            marginBottom: '2rem'
          }
        }, 'Play the classic Cassino card game online with friends!')
      ]),

      // Game Status
      gameState.roomId && React.createElement('div', {
        key: 'game-status',
        style: { 
          background: 'rgba(255,255,255,0.1)', 
          padding: '1.5rem', 
          borderRadius: '12px',
          marginBottom: '2rem',
          backdropFilter: 'blur(10px)'
        }
      }, [
        React.createElement('h2', {
          key: 'room-title',
          style: { marginBottom: '1rem' }
        }, 'Room: ' + gameState.roomId),
        React.createElement('div', {
          key: 'players',
          style: { display: 'flex', gap: '1rem', flexWrap: 'wrap' }
        }, gameState.players.map(player => 
          React.createElement('div', {
            key: player.id,
            style: {
              background: 'rgba(255,255,255,0.2)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.9rem'
            }
          }, player.name + (player.id === gameState.playerId ? ' (You)' : ''))
        ))
      ]),

      // Error Message
      gameState.error && React.createElement('div', {
        key: 'error',
        style: {
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          color: '#fca5a5'
        }
      }, gameState.error),

      // Main Actions
      React.createElement('div', {
        key: 'actions',
        style: { 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem',
          marginBottom: '3rem'
        }
      }, [
        // Create Room
        React.createElement('div', {
          key: 'create-room',
          style: {
            background: 'rgba(255,255,255,0.1)',
            padding: '2rem',
            borderRadius: '12px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)'
          }
        }, [
          React.createElement('h3', {
            key: 'create-title',
            style: { marginBottom: '1rem', fontSize: '1.5rem' }
          }, 'Create New Room'),
          React.createElement('p', {
            key: 'create-desc',
            style: { marginBottom: '1.5rem', opacity: 0.9 }
          }, 'Start a new game and invite friends to join'),
          React.createElement('button', {
            key: 'create-btn',
            onClick: createRoom,
            disabled: gameState.isLoading,
            style: {
              background: 'linear-gradient(45deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: gameState.isLoading ? 'not-allowed' : 'pointer',
              opacity: gameState.isLoading ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }
          }, gameState.isLoading ? 'Creating...' : 'Create Room')
        ]),

        // Join Room
        React.createElement('div', {
          key: 'join-room',
          style: {
            background: 'rgba(255,255,255,0.1)',
            padding: '2rem',
            borderRadius: '12px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)'
          }
        }, [
          React.createElement('h3', {
            key: 'join-title',
            style: { marginBottom: '1rem', fontSize: '1.5rem' }
          }, 'Join Existing Room'),
          React.createElement('p', {
            key: 'join-desc',
            style: { marginBottom: '1.5rem', opacity: 0.9 }
          }, 'Enter a room code to join an existing game'),
          React.createElement('button', {
            key: 'join-btn',
            onClick: joinRoom,
            disabled: gameState.isLoading,
            style: {
              background: 'linear-gradient(45deg, #3b82f6, #2563eb)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: gameState.isLoading ? 'not-allowed' : 'pointer',
              opacity: gameState.isLoading ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }
          }, gameState.isLoading ? 'Joining...' : 'Join Room')
        ])
      ]),

      // Game Rules
      React.createElement('div', {
        key: 'rules',
        style: {
          background: 'rgba(255,255,255,0.1)',
          padding: '2rem',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)'
        }
      }, [
        React.createElement('h3', {
          key: 'rules-title',
          style: { marginBottom: '1rem', fontSize: '1.5rem' }
        }, 'How to Play'),
        React.createElement('div', {
          key: 'rules-content',
          style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }
        }, [
          React.createElement('div', {
            key: 'capture-rule'
          }, [
            React.createElement('h4', {
              key: 'capture-title',
              style: { marginBottom: '0.5rem', color: '#10b981' }
            }, '🎯 Capture'),
            React.createElement('p', {
              key: 'capture-desc',
              style: { fontSize: '0.9rem', opacity: 0.9 }
            }, 'Match your card value with table cards or combinations')
          ]),
          React.createElement('div', {
            key: 'build-rule'
          }, [
            React.createElement('h4', {
              key: 'build-title',
              style: { marginBottom: '0.5rem', color: '#3b82f6' }
            }, '🏗️ Build'),
            React.createElement('p', {
              key: 'build-desc',
              style: { fontSize: '0.9rem', opacity: 0.9 }
            }, 'Combine table cards to create values you can capture')
          ]),
          React.createElement('div', {
            key: 'trail-rule'
          }, [
            React.createElement('h4', {
              key: 'trail-title',
              style: { marginBottom: '0.5rem', color: '#f59e0b' }
            }, '📝 Trail'),
            React.createElement('p', {
              key: 'trail-desc',
              style: { fontSize: '0.9rem', opacity: 0.9 }
            }, 'Place a card on the table when you can\'t capture or build')
          ])
        ])
      ]),

      // Footer
      React.createElement('footer', {
        key: 'footer',
        style: { 
          textAlign: 'center', 
          marginTop: '3rem', 
          padding: '2rem 0',
          borderTop: '1px solid rgba(255,255,255,0.2)'
        }
      }, [
        React.createElement('p', {
          key: 'footer-text',
          style: { opacity: 0.7, fontSize: '0.9rem' }
        }, 'Made with ❤️ for card game enthusiasts worldwide')
      ])
    ])
  ]);
}

// Render the app using React 18 createRoot API
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));