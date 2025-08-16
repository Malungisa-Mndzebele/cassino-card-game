import { ConvexProvider, ConvexReactClient, useMutation, useQuery } from "convex/react";

// TODO: Replace this with your actual Convex deployment URL
// TODO: Replace with your actual Convex deployment URL (e.g. https://neat-mouse-123.convex.cloud)
const convexUrl = "http://localhost:8000";

export const convex = new ConvexReactClient(convexUrl);

export { ConvexProvider, useMutation, useQuery };
