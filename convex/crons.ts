import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Schedule cleanup to run every minute
crons.interval(
  "cleanup inactive players",
  { minutes: 1 }, // Run every 1 minute
  internal.cleanup.cleanupInactivePlayers, // Function to run
  {} // Arguments (none needed for this function)
);

export default crons;
