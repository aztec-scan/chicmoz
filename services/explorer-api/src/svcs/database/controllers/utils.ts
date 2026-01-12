import { Table, and, getTableColumns, gte, lt } from "drizzle-orm";
import { ZodError } from "zod";
import { DB_MAX_BLOCKS } from "../../../environment.js";
import { logger } from "../../../logger.js";
import { l2Block } from "../schema/index.js";

export const dbParseErrorCallback = (e: unknown) => {
  if (e instanceof ZodError) {
    const newError = new Error("Internal server error (DB)");
    newError.name = "DbParseError";
    newError.cause = {
      name: e.name,
      message: e.message,
      issues: e.issues,
    };
    newError.stack = e.stack;
    logger.error(`FATAL - dbParseErrorCallback: ${JSON.stringify(e.issues)}`);
    throw newError;
  }

  if (e instanceof Error) {
    throw e;
  }

  throw new Error("Internal server error (DB)", { cause: e });
};

export const getTableColumnsWithoutId = <T extends Table>(table: T) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...tableCols } = getTableColumns(table);
  return tableCols;
};

export const getBlocksWhereRange = ({
  from,
  to,
}: {
  from: bigint | undefined;
  to: bigint | undefined;
}) => {
  let whereRange;
  if (to && from) {
    if (from > to) {
      throw new Error("Invalid range: from is greater than to");
    }
    if (to - from > DB_MAX_BLOCKS) {
      throw new Error("Invalid range: too wide of a range requested");
    }
    whereRange = and(gte(l2Block.height, from), lt(l2Block.height, to));
  } else if (from) {
    whereRange = and(
      gte(l2Block.height, from),
      lt(l2Block.height, from + BigInt(DB_MAX_BLOCKS)),
    );
  } else if (to) {
    whereRange = lt(l2Block.height, to);
  } else {
    whereRange = undefined;
  }
  return whereRange;
};
