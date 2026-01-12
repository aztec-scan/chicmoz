import { Logger } from "@chicmoz-pkg/logger-server";
import { ErrorRequestHandler } from "express";
import {
  InsufficientScopeError,
  UnauthorizedError,
} from "express-oauth2-jwt-bearer";
import { ZodError } from "zod";
import { CHICMOZ_ERRORS } from "./errors.js";

const getErrDetails = (err: unknown) => {
  const maybeErr = err as Partial<Error> & { cause?: unknown };
  return {
    name: maybeErr?.name,
    message: maybeErr?.message,
    stack: maybeErr?.stack,
    cause: maybeErr?.cause,
  };
};

export const createErrorMiddleware = (logger: Logger): ErrorRequestHandler => {
  return (err, _req, res, _next) => {
    if ((err as Error).name === "PayloadTooLargeError") {
      res
        .status(413)
        .send({ name: (err as Error).name, message: (err as Error).message });
      return;
    }

    if (
      err instanceof Error &&
      err.message === "CACHE_ERROR: latest height not found"
    ) {
      res
        .status(500)
        .send(
          "Aztec indexer has not been able to index any blocks from chain yet",
        );
      return;
    }
    if (
      err instanceof Error &&
      err.message.startsWith("CACHE_ERROR") &&
      err.message.endsWith("not found")
    ) {
      res.status(404).json();
      return;
    }

    if (err instanceof Error) {
      const errDetails = getErrDetails(err);
      logger.error(
        `Error-handler: name: ${err.name}, message: ${err.message} (for route: ${_req.originalUrl})`,
      );
      if (errDetails.cause instanceof Error) {
        logger.error(
          `Error-handler: cause name: ${errDetails.cause.name}, message: ${errDetails.cause.message}`,
        );
        if (errDetails.cause.stack) {
          logger.error(`Error-handler: cause stack: ${errDetails.cause.stack}`);
        }
      } else if (errDetails.cause !== undefined) {
        logger.error(
          `Error-handler: cause: ${JSON.stringify(errDetails.cause)}`,
        );
      }
      if (err.stack) {
        logger.error(`Error-handler: stack: ${err.stack}`);
      } else {
        logger.error(err);
      }
    }

    if (
      err instanceof UnauthorizedError ||
      err instanceof InsufficientScopeError
    ) {
      res.status(err.status).header(err.headers).send(err.message);
      return;
    }

    if (err instanceof ZodError) {
      logger.info(JSON.stringify(err.issues));
      res
        .status(400)
        .send({ message: "Schema validation error", errors: err.issues });
      return;
    }

    for (const ChicmozError of CHICMOZ_ERRORS) {
      if (err instanceof ChicmozError) {
        res.status(err.code).send({ message: err.message });
        return;
      }
    }

    res.status(500).send({ message: "An internal error occurred" });
  };
};
