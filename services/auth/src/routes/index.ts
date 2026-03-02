import { Logger } from "@chicmoz-pkg/logger-server";
import express from "express";
import { Core } from "../core.js";
import { DB } from "../database/db.js";
import { Controller } from "./controller.js";

export const newRouter = (deps: { db: DB; core: Core; logger: Logger }) => {
  const router = express.Router();

  const controller = new Controller(deps);

  router.all(`/_external-auth-*`, controller.GET_EXISTS);
  router.get(`/health`, controller.GET_HEALTH);

  return router;
};
