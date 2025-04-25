import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel'; // Import Id type
import './App.css'; // We'll add styles later

function App() {
  // Get the list of players from the Convex query
  const players = useQuery(api.players.listPlayers);
  // Get mutation functions
  const joinGame = useMutation(api.players.joinGame);
  const movePlayer = useMutation(api.players.movePlayer);

  // State to store the current player's ID
  const [currentPlayerId, setCurrentPlayerId] = useState<Id<"players"> | null>(null);

  // Join the game when the component mounts
  useEffect(() => {
    const join = async () => {
      const newPlayerId = await joinGame({}); // Pass empty object for args
      setCurrentPlayerId(newPlayerId);
    };
    join();
    // Note: No cleanup needed for joinGame, but we might need one for event listeners
  }, [joinGame]); // Dependency array includes joinGame

  // Handle keyboard input for movement
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!currentPlayerId || !players) return; // Need player ID and list

      const currentPlayer = players.find(p => p._id === currentPlayerId);
      if (!currentPlayer) return; // Current player not found in list yet

      let newX = currentPlayer.x;
      let newY = currentPlayer.y;
      const moveAmount = 10; // Pixels to move per key press

      switch (event.key) {
        case 'ArrowUp':
          newY -= moveAmount;
          break;
        case 'ArrowDown':
          newY += moveAmount;
          break;
        case 'ArrowLeft':
          newX -= moveAmount;
          break;
        case 'ArrowRight':
          newX += moveAmount;
          break;
        default:
          return; // Ignore other keys
      }

      // Call the mutation to update the player's position
      movePlayer({ playerId: currentPlayerId, x: newX, y: newY });
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPlayerId, players, movePlayer]); // Dependencies

  return (
    <div className="game-area">
      <h1>Multiplayer Demo</h1>
      {players ? (
        players.map((player) => (
          <div
            key={player._id}
            className="player"
            style={{
              left: `${player.x}px`,
              top: `${player.y}px`,
              backgroundColor: player.color,
              // Add a border if it's the current player
              border: player._id === currentPlayerId ? '2px solid black' : 'none',
            }}
          >
            {/* Optionally display player name or ID */}
            {/* {player.name} */}
          </div>
        ))
      ) : (
        <p>Loading players...</p> // Show loading state
      )}
    </div>
  );
}

export default App;
