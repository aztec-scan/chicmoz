/* eslint-disable no-console */
import { MicroserviceBaseSvc } from "@chicmoz-pkg/microservice-base";
import { createClient } from "redis";
import {
  L2_NETWORK_ID,
  REDIS_HOST,
  REDIS_PORT,
  getConfigStr,
} from "./environment.js";

// Connection configuration
const REDIS_CONNECT_TIMEOUT = 2000; // 2 seconds
const REDIS_COMMAND_TIMEOUT = 2000; // 2 seconds
const REDIS_MAX_RETRIES = 3;

let cache: ReturnType<typeof createClient>;
let isInitialized = false;
let isShutDown = false;
let isCacheAvailable = true;

export const init = async () => {
  try {
    cache = createClient({
      socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
        connectTimeout: REDIS_CONNECT_TIMEOUT,
        timeout: REDIS_COMMAND_TIMEOUT,
        reconnectStrategy: (retries) => {
          if (retries > REDIS_MAX_RETRIES) {
            console.error(
              `[REDIS] Max retries (${REDIS_MAX_RETRIES}) reached, giving up`,
            );
            return new Error("Redis connection retries exhausted");
          }
          // More aggressive backoff: 500ms, 1s, 2s, 4s, 8s
          return Math.min(Math.pow(2, retries) * 250, 8000);
        },
      },
    });

    // Handle Redis errors
    cache.on("error", (err) => {
      console.error(`[REDIS] Error: ${(err as Error).message}`);
      isCacheAvailable = false;
    });

    cache.on("ready", () => {
      console.info("[REDIS] Connection ready");
      isCacheAvailable = true;
    });

    cache.on("reconnecting", () => {
      console.warn("[REDIS] Reconnecting...");
    });

    await cache.connect();
    isInitialized = true;
    isCacheAvailable = true;
  } catch (error) {
    console.error(
      `[REDIS] Failed to initialize: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    isCacheAvailable = false;
    // Don't rethrow - allow the application to start without Redis
    isInitialized = true; // Pretend we're initialized but mark cache as unavailable
  }
};

const getCache = () => {
  if (!isInitialized) {throw new Error("Cache not initialized");}
  if (isShutDown) {throw new Error("Cache has been shut down");}
  if (!isCacheAvailable) {throw new Error("Cache is not available");}
  return cache;
};

export type CacheKeys = (string | number | bigint | undefined)[];
export type CacheValue = string | number;

export const setEntry = async (
  keys: CacheKeys,
  value: CacheValue,
  secondsTtl: number,
) => {
  if (!isCacheAvailable) {
    console.warn("[REDIS] Cache unavailable, skipping setEntry");
    return false;
  }

  try {
    return await getCache().set([L2_NETWORK_ID, ...keys].join("-"), value, {
      EX: secondsTtl,
    });
  } catch (error) {
    console.error(
      `[REDIS] setEntry error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return false;
  }
};

export const getEntry = async (keys: CacheKeys) => {
  const keysStr = [L2_NETWORK_ID, ...keys].join("-");

  if (!isCacheAvailable) {
    console.warn("[REDIS] Cache unavailable, returning null for getEntry");
    return { keysStr, value: null };
  }

  try {
    const value = await getCache().get(keysStr);
    return { keysStr, value };
  } catch (error) {
    console.error(
      `[REDIS] getEntry error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return { keysStr, value: null };
  }
};

export const cacheService: MicroserviceBaseSvc = {
  svcId: "CACHE",
  init,
  getConfigStr,
  health: () => isInitialized && isCacheAvailable && !isShutDown,
  shutdown: async () => {
    isShutDown = true;
    try {
      await cache.disconnect();
    } catch (error) {
      console.error(
        `[REDIS] Disconnect error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  },
};
