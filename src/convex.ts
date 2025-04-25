import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    "VITE_CONVEX_URL environment variable not set. Make sure to run `npx convex dev` or set it manually."
  );
}

export const convex = new ConvexReactClient(convexUrl);
