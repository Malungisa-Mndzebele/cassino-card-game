/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as createRoom from "../createRoom.js";
import type * as getGameState from "../getGameState.js";
import type * as joinRoom from "../joinRoom.js";
import type * as playCard from "../playCard.js";
import type * as resetGame from "../resetGame.js";
import type * as selectFaceUpCards from "../selectFaceUpCards.js";
import type * as setPlayerReady from "../setPlayerReady.js";
import type * as startShuffle from "../startShuffle.js";
import type * as types from "../types.js";
import type * as updateCountdown from "../updateCountdown.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  createRoom: typeof createRoom;
  getGameState: typeof getGameState;
  joinRoom: typeof joinRoom;
  playCard: typeof playCard;
  resetGame: typeof resetGame;
  selectFaceUpCards: typeof selectFaceUpCards;
  setPlayerReady: typeof setPlayerReady;
  startShuffle: typeof startShuffle;
  types: typeof types;
  updateCountdown: typeof updateCountdown;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
