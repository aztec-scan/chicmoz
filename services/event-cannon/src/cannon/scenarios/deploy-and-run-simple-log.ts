import { DeploySentTx } from "@aztec/aztec.js/contracts";
import { SimpleLoggingContract } from "../../artifacts/SimpleLogging.js";
import artifactJson from "../../contract-projects/SimpleLogging/target/simple_logging-SimpleLogging.json" with { type: "json" };
import { logger } from "../../logger.js";
import { getAztecNodeClient, getPxe, getAccounts, getWallet } from "../pxe.js";
import {
  deployContract,
  logAndWaitForTx,
  registerContractClassArtifact,
} from "./utils/index.js";
import { NoirCompiledContract } from "@aztec/aztec.js/abi";

export async function run() {
  logger.info("===== SIMPLE LOG CONTRACT =====");
  getPxe();
  const namedWallets = getAccounts();
  const wallet = getWallet();

  const deployerWallet = namedWallets.alice;

  const contractLoggingName = "SimpleLogging Contract";

  const { contract, instance: contractInstance } = await deployContract({
    contractLoggingName,
    deployFn: (): DeploySentTx<SimpleLoggingContract> =>
      SimpleLoggingContract.deploy(
        wallet,
        10,
        getAccounts().charlie.address,
      ).send({
        from: deployerWallet.address,
      }),
    node: getAztecNodeClient(),
  });

  registerContractClassArtifact(
    contractLoggingName,
    artifactJson as unknown as NoirCompiledContract,
    contractInstance.currentContractClassId.toString(),
    contractInstance.version,
  ).catch((err) => {
    logger.error(err);
  });

  await logAndWaitForTx(
    contract.methods
      .increment(getAccounts().charlie.address)
      .send({ from: deployerWallet.address }),
    "Increase counter public",
  );
}
