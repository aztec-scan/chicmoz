import { type DeploySentTx, waitForPXE } from "@aztec/aztec.js";
import { TokenContract } from "@defi-wonderland/aztec-standards/historical/0.0.0-83476cda/artifacts/artifacts/Token.js";
import { logger } from "../../logger.js";
import { getAztecNodeClient, getPxe, getWallets } from "../pxe.js";
import {
  deployContract,
  registerStandardContractArtifact,
} from "./utils/index.js";

export async function run() {
  logger.info("===== DEPLOY STANDARD CONTRACT =====");
  const pxe = getPxe();
  await waitForPXE(pxe);
  const namedWallets = getWallets();

  const deployerWallet = namedWallets.alice;

  const contractLoggingName = "Standard Token";

  const contract = await deployContract({
    contractLoggingName,
    deployFn: (): DeploySentTx<TokenContract> =>
      TokenContract.deploy(
        deployerWallet,
        "Test Token",
        "TST",
        9,
        1000000n,
        deployerWallet.getAddress(),
        deployerWallet.getAddress(),
      ).send({ from: deployerWallet.getAddress() }),
    node: getAztecNodeClient(),
  });

  await registerStandardContractArtifact(
    contractLoggingName,
    contract.instance.currentContractClassId.toString(),
    contract.instance.version,
    "token",
    "0.0.0-73e84dcc",
  );
}
