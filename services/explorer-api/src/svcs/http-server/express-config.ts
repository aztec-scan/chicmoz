import { createErrorMiddleware } from "@chicmoz-pkg/error-middleware";
import { isHealthy } from "@chicmoz-pkg/microservice-base";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import asyncHandler from "express-async-handler";
import helmet from "helmet";
import morgan from "morgan";
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
  method: string
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
  options: ExpressOptions
): express.Application {
  if (options.NODE_ENV === "production") {app.use(helmet());}
  app.use(cors({ credentials: true }));

  // NOTE: body parser should be configured AFTER proxy configuration https://www.npmjs.com/package/express-http-proxy#middleware-mixing
  app.use((req, res, next) => {
    if (isArtifactUpdate(req.path, req.method)) {return next();}
    bodyParser.json({
      limit: options.BODY_LIMIT,
    })(req, res, next);
  });

  app.use((req, res, next) => {
    if (isArtifactUpdate(req.path, req.method)) {return next();}
    bodyParser.urlencoded({
      extended: true,
      limit: options.BODY_LIMIT,
      parameterLimit: options.PARAMETER_LIMIT,
    })(req, res, next);
  });
  app.use(morgan("common"));

  const router = express.Router();
  router.get(
    "/health",
    asyncHandler((_req, res) => {
      res.status(isHealthy() ? 200 : 500).send({});
    })
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
