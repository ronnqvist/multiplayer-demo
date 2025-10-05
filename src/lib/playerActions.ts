import { supabase } from './supabase';
import type { Player } from '../types/database';

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const joinPlayer = async (name: string = 'Anonymous'): Promise<Player | null> => {
  const startX = Math.floor(Math.random() * 500);
  const startY = Math.floor(Math.random() * 500);
  const playerColor = getRandomColor();

  const { data, error } = await supabase
    .from('players')
    .insert({
      name,
      x: startX,
      y: startY,
      color: playerColor,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error joining game:', error);
    return null;
  }

  return data as Player | null;
};

export const updatePlayerPosition = async (
  playerId: string,
  x: number,
  y: number
): Promise<void> => {
  const { error } = await supabase
    .from('players')
    .update({
      x,
      y,
      last_seen: new Date().toISOString(),
    })
    .eq('id', playerId);

  if (error) {
    console.warn(`Error updating player position: ${error.message}`);
  }
};
