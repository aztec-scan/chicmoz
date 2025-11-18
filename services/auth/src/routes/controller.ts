import { Logger } from "@chicmoz-pkg/logger-server";
import { apiKeySchema } from "@chicmoz-pkg/types";
import autoBind from "auto-bind";
import { RequestHandler } from "express";
import { LRUCache } from "lru-cache";
import { Core } from "../core.js";
import { DB } from "../database/db.js";

export class Controller {
  db: DB;
  core: Core;
  logger: Logger;

  apiKeyCache: LRUCache<string, boolean>;

  constructor(deps: { db: DB; core: Core; logger: Logger }) {
    this.db = deps.db;
    this.core = deps.core;
    this.logger = deps.logger;

    this.apiKeyCache = new LRUCache({ max: 100, ttl: 1000 * 60 * 5 });
    autoBind(this);
  }

  GET_EXISTS: RequestHandler = async (req, res) => {
    const toString = (value?: string | string[]) =>
      Array.isArray(value) ? value[0] : value;

    const normalizePath = (value?: string | string[]) => {
      const str = toString(value);
      if (!str) {
        return undefined;
      }
      const stripped = str.replace(/^\/_external-auth-[^/]+/, "");
      return stripped.startsWith("/") ? stripped : undefined;
    };

    const originalRoute =
      normalizePath(req.url) ??
      normalizePath(req.headers["x-envoy-original-path"]) ??
      normalizePath(req.headers["x-forwarded-uri"]) ??
      normalizePath(req.headers[":path"]) ??
      normalizePath(req.headers["x-auth-request-redirect"]);

    if (!originalRoute) {
      this.logger.error("Missing forwarded headers for API key extraction", {
        headers: req.headers,
        url: req.url,
      });
      res.status(400).send("API key not provided");
      return;
    }

    const [found, apiKey] = this.core.extractApiKey(originalRoute);
    if (!found) {
      res.status(400).send("API key not provided");
      this.logger.error(`Did not find api-key in ${originalRoute}`);
      return;
    }

    //if (!this.core.isUUID(apiKey)) {
    //  this.logger.info(`Invalid UUID: ${apiKey}`);
    //  // TODO: for some reason it returns 500, fix it
    //  res.status(400).send(`Invalid UUID: ${apiKey}`);
    //  return;
    //}

    let exists: boolean;
    //if (this.apiKeyCache.get(apiKey)) {
    //  exists = true;
    //} else {
    //  exists = (await this.db.getByApiKey(apiKey)) !== null;
    //  if (exists) this.apiKeyCache.set(apiKey, true);
    //}

    try {
      apiKeySchema.parse(apiKey);
      exists = true;
    } catch (e) {
      this.logger.info((e as Error).message);
      exists = false;
    }

    if (!exists) {
      this.logger.info(`API key does not exist: ${apiKey}`);
      res.status(403).send("Invalid API key");
      return;
    }

    //const xOriginalUrl = req.get("x-original-url");

    //if (!xOriginalUrl) {
    // this.logger.info("Invalid original URL");
    // res.status(404).send("Invalid original URL");
    // return;
    //}

    const overrideLimitsForNow = true;

    const isSecLimitReached = await this.core.checkRequestLimitReached(
      "seconds",
      apiKey,
    );
    if (isSecLimitReached && !overrideLimitsForNow) {
      this.logger.info("Reached request limit per second");
      res.status(403).send("Reached request limit per second");
      return;
    }

    const isMonthLimitReached = await this.core.checkRequestLimitReached(
      "month",
      apiKey,
    );
    if (isMonthLimitReached && !overrideLimitsForNow) {
      this.logger.info("Reached request limit per month");
      res.status(403).send("Reached request limit per month");
      return;
    }

    res.sendStatus(200);
  };

  GET_HEALTH: RequestHandler = (_req, res) => {
    res.sendStatus(200);
  };
}
