import { NODE_ENV, NodeEnv } from "@chicmoz-pkg/types";
import {
  CACHE_LATEST_TTL_SECONDS,
  CACHE_TTL_SECONDS,
} from "../../../../../environment.js";
import { logger } from "../../../../../logger.js";
import { CacheKeys, getEntry, setEntry } from "../../../../cache/index.js";
import { dbParseErrorCallback } from "../../../../database/controllers/utils.js";
import { controllers as db } from "../../../../database/index.js";

const LATEST_HEIGHT = "latestHeight";

export const getLatestHeight = async () => {
  const cachedVal = await getEntry([LATEST_HEIGHT]);
  const isCached = cachedVal !== null && cachedVal !== undefined;
  if (isCached) return cachedVal;

  const dbVal = await db.l2Block.getLatestHeight().catch(dbParseErrorCallback);
  if (dbVal) {
    await setEntry([LATEST_HEIGHT], dbVal.toString(), CACHE_LATEST_TTL_SECONDS);
    return dbVal;
  }
  throw new Error("CACHE_ERROR: latest height not found");
};

export const getLatest = async (
  keys: CacheKeys,
  dbFn: () => Promise<unknown>
): Promise<string | undefined> => {
  const latestHeight = await getLatestHeight();
  if (!latestHeight) throw new Error("CACHE_ERROR: latest height not found");
  // NOTE: we add one second to the TTL to ensure that stale cache is not stored
  return get([...keys, latestHeight], dbFn, CACHE_LATEST_TTL_SECONDS + 1);
};

const jsonStringify = (param: unknown): string => {
  // TODO: move this to backend-utils and make use of it in websockets as well
  return JSON.stringify(
    param,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    (_key, value) => (typeof value === "bigint" ? value.toString() : value)
  );
};

export const get = async (
  keys: CacheKeys,
  dbFn: () => Promise<unknown>,
  ttl = CACHE_TTL_SECONDS
): Promise<string | undefined> => {
  const cachedVal = await getEntry(keys);
  const isCached = cachedVal !== null && cachedVal !== undefined;
  if (isCached) {
    if (NODE_ENV === NodeEnv.DEV)
      logger.info(`CACHE_HIT: ${JSON.stringify(keys)}`);
    return cachedVal;
  }

  const dbRes = await dbFn().catch(dbParseErrorCallback);
  if (dbRes !== null && dbRes !== undefined) {
    const dbResString = jsonStringify(dbRes);
    await setEntry(keys, dbResString, ttl);
    return dbResString;
  }
};
