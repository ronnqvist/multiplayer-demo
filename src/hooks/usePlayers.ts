import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Player } from '../types/database';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export const usePlayers = () => {
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('players')
          .select('*')
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;

        setPlayers(data || []);
        setIsLoading(false);
      } catch (err) {
        setError(err as Error);
        setIsLoading(false);
      }
    };

    fetchPlayers();

    const channel = supabase
      .channel('players-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'players',
        },
        (payload: RealtimePostgresChangesPayload<Player>) => {
          setPlayers((current) => {
            if (!current) return [payload.new as Player];
            return [...current, payload.new as Player];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
        },
        (payload: RealtimePostgresChangesPayload<Player>) => {
          setPlayers((current) => {
            if (!current) return [payload.new as Player];
            return current.map((player) =>
              player.id === (payload.new as Player).id ? (payload.new as Player) : player
            );
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'players',
        },
        (payload: RealtimePostgresChangesPayload<Player>) => {
          setPlayers((current) => {
            if (!current) return [];
            return current.filter((player) => player.id !== (payload.old as Player).id);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { players, isLoading, error };
};
