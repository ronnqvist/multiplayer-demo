import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import './App.css';

const MOVE_SPEED = 5; // Pixels per frame (adjust as needed)
const UPDATE_INTERVAL_MS = 50; // Send updates to server more frequently

function App() {
  const players = useQuery(api.players.listPlayers);
  const joinGame = useMutation(api.players.joinGame);
  const movePlayer = useMutation(api.players.movePlayer);

  const [currentPlayerId, setCurrentPlayerId] = useState<Id<"players"> | null>(null);

  // Refs for smooth movement
  const pressedKeys = useRef<Record<string, boolean>>({});
  const localPosition = useRef<{ x: number; y: number } | null>(null);
  const lastSentPosition = useRef<{ x: number; y: number } | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const intervalId = useRef<number | null>(null); // Use 'number' for browser interval ID

  // Join game on mount
  useEffect(() => {
    const join = async () => {
      const newPlayerId = await joinGame({});
      setCurrentPlayerId(newPlayerId);
      // Initialize local position when player data becomes available
    };
    join();
  }, [joinGame]);

  // Initialize local position once player data is available
  useEffect(() => {
    if (!localPosition.current && currentPlayerId && players) {
      // Explicitly type 'p' based on the inferred type of 'players' elements
      const me = players.find((p: typeof players[number]) => p._id === currentPlayerId);
      if (me) {
        localPosition.current = { x: me.x, y: me.y };
        lastSentPosition.current = { x: me.x, y: me.y }; // Initialize last sent position
      }
    }
  }, [players, currentPlayerId]);


  // Handle Key Down/Up
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      pressedKeys.current[event.key] = true;
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeys.current[event.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Clear interval and animation frame on unmount
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (intervalId.current) clearInterval(intervalId.current);
    };
  }, []); // Empty dependency array: run only once on mount/unmount

  // Game Loop using requestAnimationFrame
  useEffect(() => {
    const gameLoop = () => {
      if (!localPosition.current || !currentPlayerId) {
        animationFrameId.current = requestAnimationFrame(gameLoop);
        return; // Wait until position is initialized
      }

      let dx = 0;
      let dy = 0;

      if (pressedKeys.current['ArrowUp']) dy -= MOVE_SPEED;
      if (pressedKeys.current['ArrowDown']) dy += MOVE_SPEED;
      if (pressedKeys.current['ArrowLeft']) dx -= MOVE_SPEED;
      if (pressedKeys.current['ArrowRight']) dx += MOVE_SPEED;

      if (dx !== 0 || dy !== 0) {
        localPosition.current.x += dx;
        localPosition.current.y += dy;
        // Optional: Add boundary checks here if needed
      }

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [currentPlayerId]); // Re-run if currentPlayerId changes (though unlikely)


  // Periodic Server Update
  useEffect(() => {
    intervalId.current = setInterval(() => {
      if (currentPlayerId && localPosition.current && lastSentPosition.current) {
        // Only send update if position has changed significantly
        const dx = localPosition.current.x - lastSentPosition.current.x;
        const dy = localPosition.current.y - lastSentPosition.current.y;

        // Send update if moved at least 1 pixel in either direction
        if (Math.abs(dx) >= 1 || Math.abs(dy) >= 1) {
          movePlayer({
            playerId: currentPlayerId,
            x: Math.round(localPosition.current.x), // Send rounded position
            y: Math.round(localPosition.current.y),
          });
          // Update last sent position immediately after sending
          lastSentPosition.current = {
             x: localPosition.current.x,
             y: localPosition.current.y
          };
        }
      }
    }, UPDATE_INTERVAL_MS);

    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [currentPlayerId, movePlayer]); // Dependencies for the interval effect


  // Render players based on Convex data
  return (
    <div className="game-area">
      <h1>Multiplayer Demo</h1>
      {players ? (
        // Explicitly type 'player' based on the inferred type of 'players' elements
        players.map((player: typeof players[number]) => (
          <div
            key={player._id}
            className="player"
            style={{
              // Render using server position for consistency across clients
              left: `${player.x}px`,
              top: `${player.y}px`,
              backgroundColor: player.color,
              border: player._id === currentPlayerId ? '2px solid black' : 'none',
              // Smooth transition applied via CSS
            }}
          />
        ))
      ) : (
        <p>Loading players...</p>
      )}
    </div>
  );
}

export default App;
