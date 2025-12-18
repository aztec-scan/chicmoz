import { createErrorMiddleware } from "@chicmoz-pkg/error-middleware";
import { isHealthy } from "@chicmoz-pkg/microservice-base";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import asyncHandler from "express-async-handler";
import helmet from "helmet";
import morgan, { FormatFn } from "morgan";
import { logger } from "../../logger.js";
import { genereateOpenApiSpec } from "./open-api-spec.js";
import { init as initApiRoutes } from "./routes/index.js";
import { paths } from "./routes/paths_and_validation.js";

type ExpressOptions = {
  BODY_LIMIT: string;
  PARAMETER_LIMIT: number;
  NODE_ENV: string;
};

const splitCCPath = paths.contractClass.split("/");
const splitCIPath = paths.contractInstance.split("/");

const isContractClassArtifactUpdate = (path: string, method: string) => {
  const splitPath = path.split("/");
  return (
    method === "POST" &&
    splitPath.length === splitCCPath.length &&
    splitPath[1] === splitCCPath[1] &&
    splitPath[2] === splitCCPath[2] &&
    splitPath[4] === splitCCPath[4]
  );
};
const isContractInstanceVerifiedDeploymentUpdate = (
  path: string,
  method: string,
) => {
  const splitPath = path.split("/");
  return (
    method === "POST" &&
    splitPath.length === splitCIPath.length &&
    splitPath[1] === splitCIPath[1] &&
    splitPath[2] === splitCIPath[2]
  );
};
const isArtifactUpdate = (path: string, method: string) => {
  return (
    isContractClassArtifactUpdate(path, method) ||
    isContractInstanceVerifiedDeploymentUpdate(path, method)
  );
};

export function setup(
  app: express.Application,
  options: ExpressOptions,
): express.Application {
  if (options.NODE_ENV === "production") {
    app.use(helmet());
  }
  app.use(cors({ credentials: true }));

  // NOTE: body parser should be configured AFTER proxy configuration https://www.npmjs.com/package/express-http-proxy#middleware-mixing
  // NOTE: Artifact routes skip global body parsing because they use route-specific parsers with ARTIFACT_BODY_LIMIT
  app.use((req, res, next) => {
    if (isArtifactUpdate(req.path, req.method)) {
      return next();
    }
    bodyParser.json({
      limit: options.BODY_LIMIT,
    })(req, res, next);
  });

  app.use((req, res, next) => {
    if (isArtifactUpdate(req.path, req.method)) {
      return next();
    }
    bodyParser.urlencoded({
      extended: true,
      limit: options.BODY_LIMIT,
      parameterLimit: options.PARAMETER_LIMIT,
    })(req, res, next);
  });
  app.use(morgan("dev"));
  app.use(morgan(morganUnacceptableResponseTimeMiddleware));

  const router = express.Router();
  router.get(
    "/health",
    asyncHandler((_req, res) => {
      res.status(isHealthy() ? 200 : 500).send({});
    }),
  );
  const openApiSpec = genereateOpenApiSpec();
  router.get("/open-api-specification", (_req, res) => {
    res.json(openApiSpec);
  });
  initApiRoutes({ router });
  app.use(router);

  const errorMiddleware = createErrorMiddleware(logger);
  app.use(errorMiddleware);
  return app;
}

const morganUnacceptableResponseTimeMiddleware: FormatFn = (
  tokens,
  req,
  res,
) => {
  const responseTime = parseFloat(tokens["response-time"](req, res) ?? "0");
  let responseTimeColor;
  if (responseTime < 2500) {
    responseTimeColor = "\x1b[33m";
  } else {
    responseTimeColor = "\x1b[31m";
  }
  const resetColor = "\x1b[0m";
  return responseTime > 1500
    ? `UNACCEPTABLE RESPONSE TIME ${responseTimeColor}${Math.round(
        responseTime,
      )}ms${resetColor}`
    : undefined;
};
