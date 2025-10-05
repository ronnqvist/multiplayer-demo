/*
  # Create Players Table for Multiplayer Demo

  1. New Tables
    - `players`
      - `id` (uuid, primary key, auto-generated)
      - `name` (text, player name, default 'Anonymous')
      - `x` (numeric, player x-coordinate position)
      - `y` (numeric, player y-coordinate position)
      - `color` (text, player color in hex format like '#FF0000')
      - `last_seen` (timestamptz, timestamp of last activity, auto-updated)
      - `created_at` (timestamptz, timestamp of player creation)

  2. Security
    - Enable RLS on `players` table
    - Add policy for public SELECT access (allow anyone to view all players)
    - Add policy for public INSERT access (allow anyone to join the game)
    - Add policy for public UPDATE access (allow anyone to update player positions)
    - Add policy for public DELETE access (allow cleanup operations)

  3. Performance
    - Add index on `last_seen` column for efficient cleanup queries

  4. Realtime
    - This table will use Supabase Realtime for live player synchronization
*/

-- Create the players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Anonymous',
  x numeric NOT NULL,
  y numeric NOT NULL,
  color text NOT NULL,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to view all players
CREATE POLICY "Allow public read access to players"
  ON players
  FOR SELECT
  TO public
  USING (true);

-- Policy: Allow anyone to insert new players
CREATE POLICY "Allow public insert access to players"
  ON players
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Allow anyone to update player positions
CREATE POLICY "Allow public update access to players"
  ON players
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Policy: Allow anyone to delete players (for cleanup)
CREATE POLICY "Allow public delete access to players"
  ON players
  FOR DELETE
  TO public
  USING (true);

-- Create index on last_seen for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_players_last_seen ON players(last_seen);

-- Create a function to cleanup inactive players
CREATE OR REPLACE FUNCTION cleanup_inactive_players()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM players
  WHERE last_seen < NOW() - INTERVAL '15 seconds';
END;
$$;