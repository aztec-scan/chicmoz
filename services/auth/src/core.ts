import { Logger } from "@chicmoz-pkg/logger-server";
import autoBind from "auto-bind";
import { DB } from "./database/db.js";
import { Period, RateLimitDb } from "./database/rate-limit.js";

const UUID_REGEX =
  "([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})";

export class Core {
  private readonly logger: Logger;
  private readonly db: DB;
  private readonly rateLimitDb: RateLimitDb;

  constructor(deps: { logger: Logger; db: DB; rateLimitDb: RateLimitDb }) {
    this.logger = deps.logger;
    this.db = deps.db;
    this.rateLimitDb = deps.rateLimitDb;

    autoBind(this);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async init() {}

  extractApiKey(url: string): [true, string] | [false, undefined] {
	// Handle both full URLs and paths
    let pathToCheck = url;

    // If it's a full URL, extract just the path
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const urlObj = new URL(url);
        pathToCheck = urlObj.pathname;
      } catch (e) {
        return [false, undefined];
      }
    }
    const re = RegExp("^/(v1|api)/(.+?)(/|$)");
    const apiUrl = re.exec(pathToCheck);
    if (!apiUrl || apiUrl.length < 3) {
      return [false, undefined];
    }
    return [true, apiUrl[2]];
  }

  isUUID(u: string): boolean {
    const re = RegExp(UUID_REGEX);
    return re.exec(u) !== null;
  }

  checkRequestLimitReached(period: Period, apiKey: string) {
    // TODO: publish limit exceeded events to message bus
    return this.rateLimitDb.checkRequestLimitReached(period, apiKey);
  }
}
