import React from 'react';

// Mock Convex client for static deployment
// This allows the game to run without a backend temporarily

// Create mock implementations
const mockConvex = {
  // Mock for mutation calls
  mutation: () => () => Promise.resolve({}),
  // Mock for query calls  
  query: () => () => null,
};

export const convex = mockConvex;

// Mock implementations for React hooks
export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children);
}

export function useMutation() {
  return () => Promise.resolve({});
}

export function useQuery() {
  return null;
}
