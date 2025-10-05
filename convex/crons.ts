import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Schedule cleanup to run every 15 seconds
crons.interval(
  "cleanup inactive players",
  { seconds: 15 }, // Run every 15 seconds
  internal.cleanup.cleanupInactivePlayers, // Function to run
  {} // Arguments (none needed for this function)
);

export default crons;
