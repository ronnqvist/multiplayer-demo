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
  // State for local position to trigger re-renders
  const [localPosition, setLocalPosition] = useState<{ x: number; y: number } | null>(null);

  // Refs for non-rendering state
  const pressedKeys = useRef<Record<string, boolean>>({});
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

  // Initialize local position state once player data is available
  useEffect(() => {
    if (!localPosition && currentPlayerId && players) { // Check state, not ref
      const me = players.find((p: typeof players[number]) => p._id === currentPlayerId);
      if (me) {
        setLocalPosition({ x: me.x, y: me.y }); // Set state
        lastSentPosition.current = { x: me.x, y: me.y }; // Initialize ref
      }
    }
    // Only re-initialize if localPosition is null (e.g., on first load)
  }, [players, currentPlayerId, localPosition]);


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
      // Use state for current position
      setLocalPosition(currentLocalPos => {
        if (!currentLocalPos || !currentPlayerId) {
          // If position is not set yet, don't update, just request next frame
          animationFrameId.current = requestAnimationFrame(gameLoop);
          return currentLocalPos;
        }

        let dx = 0;
        let dy = 0;

      if (pressedKeys.current['ArrowUp']) dy -= MOVE_SPEED;
      if (pressedKeys.current['ArrowDown']) dy += MOVE_SPEED;
      if (pressedKeys.current['ArrowLeft']) dx -= MOVE_SPEED;
        if (pressedKeys.current['ArrowRight']) dx += MOVE_SPEED;

        if (dx !== 0 || dy !== 0) {
          // Return the new position state
          return {
            x: currentLocalPos.x + dx,
            y: currentLocalPos.y + dy,
            // Optional: Add boundary checks here if needed
          };
        }
        // If no keys pressed, return the current position unchanged
        return currentLocalPos;
      });

      // Always request the next frame
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  // No dependency on localPosition state here, loop runs independently
  }, [currentPlayerId]);


  // Periodic Server Update
  useEffect(() => {
    intervalId.current = setInterval(() => {
      // Read from localPosition state
      if (currentPlayerId && localPosition && lastSentPosition.current) {
        const dx = localPosition.x - lastSentPosition.current.x;
        const dy = localPosition.y - lastSentPosition.current.y;

        if (Math.abs(dx) >= 1 || Math.abs(dy) >= 1) {
          movePlayer({
            playerId: currentPlayerId,
            x: Math.round(localPosition.x), // Send rounded state position
            y: Math.round(localPosition.y),
          });
          // Update last sent position ref
          lastSentPosition.current = {
             x: localPosition.x,
             y: localPosition.y
          };
        }
      }
    }, UPDATE_INTERVAL_MS);

    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  // Dependency includes localPosition state now
  }, [currentPlayerId, movePlayer, localPosition]);


  // Render players
  return (
    <div className="game-area">
      <h1>Multiplayer Demo</h1>
      {players ? (
        players.map((player: typeof players[number]) => {
          // Determine position: use local state for current player, server state for others
          const isCurrentPlayer = player._id === currentPlayerId;
          const position = isCurrentPlayer && localPosition ? localPosition : { x: player.x, y: player.y };

          return (
            <div
              key={player._id}
              className="player"
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                backgroundColor: player.color,
                border: isCurrentPlayer ? '2px solid black' : 'none',
                // Remove transition for current player if it exists in CSS,
                // or add specific style here: transition: isCurrentPlayer ? 'none' : 'left 0.1s linear, top 0.1s linear',
              }}
            />
          );
        })
      ) : (
        <p>Loading players...</p>
      )}
    </div>
  );
}

export default App;
