import { TokenContract } from "@aztec/noir-contracts.js/Token";
import { logger } from "../../logger.js";
import { getAccounts, getAztecNodeClient, getPxe, getWallet } from "../pxe.js";
import {
  deployContract,
  registerStandardContractArtifact,
} from "./utils/index.js";
import { DeploySentTx } from "@aztec/aztec.js/contracts";

export async function run() {
  logger.info("===== DEPLOY STANDARD CONTRACT =====");
  getPxe();
  const namedWallets = getAccounts();
  const wallet = getWallet();

  const deployerWallet = namedWallets.alice;

  const contractLoggingName = "Standard Token";

  const { instance: contractInstance } = await deployContract({
    contractLoggingName,
    deployFn: (): DeploySentTx<TokenContract> =>
      TokenContract.deploy(
        wallet,
        deployerWallet.address,
        "Test Token",
        "TST",
        9,
      ).send({ from: deployerWallet.address }),
    node: getAztecNodeClient(),
  });

  await registerStandardContractArtifact(
    contractLoggingName,
    contractInstance.currentContractClassId.toString(),
    contractInstance.version,
    "token",
    "0.0.0-73e84dcc",
  );
}
