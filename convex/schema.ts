import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  players: defineTable({
    name: v.string(), // We might not use this initially, but good to have
    x: v.number(),
    y: v.number(),
    color: v.string(), // e.g., "#FF0000"
    lastSeen: v.optional(v.number()), // Timestamp of the last update - optional for backward compatibility
  }),
});
