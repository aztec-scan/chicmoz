import { z } from "zod";

export const SERVICE_NAME = process.env.SERVICE_NAME ?? "event-cannon";

export const AZTEC_RPC_URL =
  process.env.AZTEC_RPC_URL ?? "http://aztec.sandbox.chicmoz.localhost";
export const ETHEREUM_RPC_URL =
  process.env.ETHEREUM_RPC_URL ?? "http://eth.sandbox.chicmoz.localhost";
export const EXPLORER_API_URL =
  process.env.EXPLORER_API_URL ?? "http://api.sandbox.chicmoz.localhost/v1";

export const SCENARIO_DELAY = z.coerce
  .number()
  .default(1000)
  .parse(process.env.SCENARIO_DELAY);

export const INIFINITE_LOOP = process.env.INIFINITE_LOOP === "true";

export const SCENARIO_SIMPLE_DEFAULT_ACCOUNT =
  process.env.SCENARIO_SIMPLE_DEFAULT_ACCOUNT === "true";
export const SCENARIO_TOKEN_CONTRACT =
  process.env.SCENARIO_TOKEN_CONTRACT === "true";
export const SCENARIO_FUNCTIONS_VOTE =
  process.env.SCENARIO_FUNCTIONS_VOTE === "true";
export const SCENARIO_SIMPLE_CONTRACT =
  process.env.SCENARIO_SIMPLE_CONTRACT === "true";
export const SCENARIO_SIMPLE_LOG =
  process.env.SCENARIO_SIMPLE_LOG === "true";
export const SCENARIO_L1L2_PUBLIC_MESSAGING =
  process.env.SCENARIO_L1L2_PUBLIC_MESSAGING === "true";
export const SCENARIO_L1L2_PRIVATE_MESSAGING =
  process.env.SCENARIO_L1L2_PRIVATE_MESSAGING === "true";
export const SCENARIO_DEPLOY_AND_UPDATE =
  process.env.SCENARIO_DEPLOY_AND_UPDATE === "true";
