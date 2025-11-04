import { getInitialTestAccountsData } from "@aztec/accounts/testing";
import { TestWallet } from "@aztec/test-wallet/server";
import { createStore } from "@aztec/kv-store/lmdb";
import { AZTEC_RPC_URL } from "../environment.js";
import { AztecNode, createAztecNodeClient } from "@aztec/aztec.js/node";
import { createPXE, getPXEConfig, PXE } from "@aztec/pxe/server";
import { AccountManager } from "@aztec/aztec.js/wallet";

let pxe: PXE;
let aztecNode: AztecNode;
let wallet: TestWallet;
let namedAccounts: {
  alice: AccountManager;
  bob: AccountManager;
  charlie: AccountManager;
} | null = null;

export const setup = async () => {
  aztecNode = createAztecNodeClient(AZTEC_RPC_URL);
  const l1Contracts = await aztecNode.getL1ContractAddresses();
  const config = getPXEConfig();
  const fullConfig = { ...config, l1Contracts };
  fullConfig.proverEnabled = false;

  const store = await createStore("pxe", {
    dataDirectory: "store",
    dataStoreMapSizeKb: 1e6,
  });
  pxe = await createPXE(aztecNode, fullConfig, { store });

  wallet = await TestWallet.create(aztecNode);
  const [aliceAccount, bobAccount, charlieAccount] =
    await getInitialTestAccountsData();

  const alice = await wallet.createSchnorrAccount(
    aliceAccount.secret,
    aliceAccount.salt,
  );
  const bob = await wallet.createSchnorrAccount(
    bobAccount.secret,
    bobAccount.salt,
  );
  const charlie = await wallet.createSchnorrAccount(
    charlieAccount.secret,
    charlieAccount.salt,
  );

  namedAccounts = {
    alice,
    bob,
    charlie,
  };
};

export const getAztecNodeClient = () => {
  if (!aztecNode) {
    throw new Error("Aztec Node not initialized");
  }
  return aztecNode;
};

export const getPxe = () => {
  if (!pxe) {
    throw new Error("PXE not initialized");
  }
  return pxe;
};

export const getAccounts = () => {
  if (!namedAccounts) {
    throw new Error("Wallets not initialized");
  }
  return namedAccounts;
};

export const getWallet = () => {
  if (!wallet) {
    throw new Error("Wallets not initialized");
  }
  return wallet;
};
