import { useState, useEffect, useRef } from 'react';
import { usePlayers } from './hooks/usePlayers';
import { joinPlayer, updatePlayerPosition } from './lib/playerActions';
import './App.css';

const MOVE_SPEED = 5;
const UPDATE_INTERVAL_MS = 50;
const GAME_AREA_WIDTH = 600;
const GAME_AREA_HEIGHT = 600;
const PLAYER_SIZE = 20;

function App() {
  const { players, isLoading } = usePlayers();
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

  const pressedKeys = useRef<Record<string, boolean>>({});
  const localPosition = useRef<{ x: number; y: number } | null>(null);
  const lastSentPosition = useRef<{ x: number; y: number } | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const playerIdKey = 'multiplayerDemoPlayerId';
    const existingPlayerId = localStorage.getItem(playerIdKey);

    const initializePlayer = async () => {
      if (existingPlayerId) {
        setCurrentPlayerId(existingPlayerId);
        console.log("Existing player joined:", existingPlayerId);
      } else {
        console.log("No existing player found, creating new one...");
        const newPlayer = await joinPlayer();
        if (newPlayer) {
          localStorage.setItem(playerIdKey, newPlayer.id);
          setCurrentPlayerId(newPlayer.id);
          console.log("New player created:", newPlayer.id);
        } else {
          console.error("Failed to create player.");
        }
      }
    };

    if (!currentPlayerId) {
      initializePlayer();
    }
  }, [currentPlayerId]);

  useEffect(() => {
    if (currentPlayerId && players && !isLoading) {
      const me = players.find((p) => p.id === currentPlayerId);
      if (me) {
        if (!localPosition.current) {
          localPosition.current = { x: Number(me.x), y: Number(me.y) };
          lastSentPosition.current = { x: Number(me.x), y: Number(me.y) };
        }
      }
    }
  }, [players, currentPlayerId, isLoading]);

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
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (intervalId.current) clearInterval(intervalId.current);
    };
  }, []);

  useEffect(() => {
    const gameLoop = () => {
      if (!localPosition.current || !currentPlayerId) {
        animationFrameId.current = requestAnimationFrame(gameLoop);
        return;
      }

      let dx = 0;
      let dy = 0;

      if (pressedKeys.current['ArrowUp']) dy -= MOVE_SPEED;
      if (pressedKeys.current['ArrowDown']) dy += MOVE_SPEED;
      if (pressedKeys.current['ArrowLeft']) dx -= MOVE_SPEED;
      if (pressedKeys.current['ArrowRight']) dx += MOVE_SPEED;

      if (dx !== 0 || dy !== 0) {
        let newX = localPosition.current.x + dx;
        let newY = localPosition.current.y + dy;

        newX = Math.max(0, Math.min(newX, GAME_AREA_WIDTH - PLAYER_SIZE));
        newY = Math.max(0, Math.min(newY, GAME_AREA_HEIGHT - PLAYER_SIZE));

        localPosition.current.x = newX;
        localPosition.current.y = newY;
      }

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [currentPlayerId]);

  useEffect(() => {
    intervalId.current = setInterval(() => {
      if (currentPlayerId && localPosition.current && lastSentPosition.current) {
        const dx = localPosition.current.x - lastSentPosition.current.x;
        const dy = localPosition.current.y - lastSentPosition.current.y;

        if (Math.abs(dx) >= 1 || Math.abs(dy) >= 1) {
          updatePlayerPosition(
            currentPlayerId,
            Math.round(localPosition.current.x),
            Math.round(localPosition.current.y)
          );
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
  }, [currentPlayerId]);

  return (
    <div className="game-area">
      <h1>Multiplayer Demo</h1>
      {!isLoading && players ? (
        players.map((player) => (
          <div
            key={player.id}
            className="player"
            style={{
              left: `${Number(player.x)}px`,
              top: `${Number(player.y)}px`,
              backgroundColor: player.color,
              border: player.id === currentPlayerId ? '2px solid black' : 'none',
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
