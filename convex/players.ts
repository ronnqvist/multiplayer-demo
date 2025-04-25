import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Function to generate a random hex color
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Mutation to add a new player to the game
export const joinGame = mutation({
  args: { name: v.optional(v.string()) }, // Name is optional for now
  handler: async (ctx, args) => {
    const playerName = args.name || "Anonymous"; // Default name if not provided
    const startX = Math.floor(Math.random() * 500); // Random start position
    const startY = Math.floor(Math.random() * 500);
    const playerColor = getRandomColor();

    const playerId = await ctx.db.insert("players", {
      name: playerName,
      x: startX,
      y: startY,
      color: playerColor,
    });
    return playerId; // Return the ID of the newly created player
  },
});

// Mutation to update a player's position
export const movePlayer = mutation({
  args: {
    playerId: v.id("players"),
    x: v.number(),
    y: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.playerId, { x: args.x, y: args.y });
  },
});

// Query to get all current players
export const listPlayers = query({
  handler: async (ctx) => {
    // Fetch all documents from the 'players' table
    const players = await ctx.db.query("players").collect();
    return players;
  },
});

// Mutation to delete all players (for resetting the game)
// WARNING: In a real app, this should be heavily restricted/authorized.
export const deleteAllPlayers = mutation({
  args: {}, // No arguments needed
  handler: async (ctx) => {
    // Get all player documents
    const allPlayers = await ctx.db.query("players").collect();

    // Delete each player
    // Consider potential performance implications for very large numbers of players.
    // For huge scale, a different approach might be needed.
    for (const player of allPlayers) {
      await ctx.db.delete(player._id);
    }
    console.log(`Deleted ${allPlayers.length} players.`);
  },
});
