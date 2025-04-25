import { internalMutation } from "./_generated/server";

const INACTIVITY_THRESHOLD_MS = 60 * 1000; // 1 minute

export const cleanupInactivePlayers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cutoff = now - INACTIVITY_THRESHOLD_MS;

    // Find players whose lastSeen is older than the cutoff
    const inactivePlayers = await ctx.db
      .query("players")
      .filter((q) => q.lt(q.field("lastSeen"), cutoff))
      .collect();

    if (inactivePlayers.length > 0) {
      console.log(`Cleaning up ${inactivePlayers.length} inactive players...`);
      // Delete each inactive player
      for (const player of inactivePlayers) {
        await ctx.db.delete(player._id);
      }
      console.log("Cleanup complete.");
    } else {
      // console.log("No inactive players found for cleanup."); // Optional: Log when nothing to clean
    }
  },
});
