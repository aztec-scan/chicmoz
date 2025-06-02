import { getDeployedTestAccountsWallets } from "@aztec/accounts/testing";
import {
  AccountWallet,
  AztecNode,
  PXE,
  createAztecNodeClient,
  createPXEClient,
  waitForPXE,
} from "@aztec/aztec.js";
import { AZTEC_RPC_URL } from "../environment.js";
import { logger } from "../logger.js";

let pxe: PXE;
let aztecNode: AztecNode;
let namedWallets: {
  alice: AccountWallet;
  bob: AccountWallet;
  charlie: AccountWallet;
} | null = null;

export const setup = async () => {
  aztecNode = createAztecNodeClient(AZTEC_RPC_URL);
  pxe = createPXEClient(AZTEC_RPC_URL);
  await waitForPXE(pxe);
  const info = await pxe.getPXEInfo();
  logger.info(JSON.stringify(info));
  const initialAccountWallets = await getDeployedTestAccountsWallets(pxe);
  logger.info(`Found ${initialAccountWallets.length} initial accounts`);
  const [alice, bob, charlie] = initialAccountWallets;
  namedWallets = {
    alice,
    bob,
    charlie,
  };
};

export const getAztecNodeClient = () => {
  if (!aztecNode) {throw new Error("Aztec Node not initialized");}
  return aztecNode;
};

export const getPxe = () => {
  if (!pxe) {throw new Error("PXE not initialized");}
  return pxe;
};

export const getWallets = () => {
  if (!namedWallets) {throw new Error("Wallets not initialized");}
  return namedWallets;
};
