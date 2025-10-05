export type Player = {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  last_seen: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      players: {
        Row: Player;
        Insert: Omit<Player, 'id' | 'created_at' | 'last_seen'> & {
          id?: string;
          created_at?: string;
          last_seen?: string;
        };
        Update: Partial<Omit<Player, 'id' | 'created_at'>> & {
          last_seen?: string;
        };
      };
    };
  };
};
