import { logger } from "../../logger.js";
import { getWallet } from "../pxe.js";
import { getNewAccount } from "./utils/index.js";

export async function run() {
  logger.info("===== SIMPLE DEFAULT ACCOUNT =====");
  const wallet = getWallet();
  await getNewAccount(wallet, "DEFAULT");
}
