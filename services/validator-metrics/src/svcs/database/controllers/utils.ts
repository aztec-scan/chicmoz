import { Table, getTableColumns} from "drizzle-orm";
import { ZodError } from "zod";
import { logger } from "../../../logger.js";

export const dbParseErrorCallback = (e: Error) => {
  if (e instanceof ZodError) {
    const newError = new Error("Internal server error (DB)");
    newError.name = "DbParseError";
    newError.cause = e;
    newError.stack = e.stack;
    logger.error(`FATAL - dbParseErrorCallback: ${JSON.stringify(e.issues)}`);
    throw newError;
  } else {
    // NOTE: this should never happen
    logger.error(
      `BIG PROBLEM - dbParseErrorCallback: returned an error that is not ZodError: ${e.message}`
    );
    throw e;
  }
};

export const getTableColumnsWithoutId = <T extends Table>(table: T) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...tableCols } = getTableColumns(table);
  return tableCols;
};
