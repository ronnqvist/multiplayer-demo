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
      lastSeen: Date.now(), // Set initial timestamp
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
    // Check if the player document still exists before patching
    const player = await ctx.db.get(args.playerId);
    if (player) {
      // Update position and lastSeen timestamp
      await ctx.db.patch(args.playerId, {
        x: args.x,
        y: args.y,
        lastSeen: Date.now(),
      });
    } else {
      // Optionally log that the player was already deleted
      console.warn(`Attempted to move non-existent player: ${args.playerId}`);
    }
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

// Removed deleteAllPlayers mutation
