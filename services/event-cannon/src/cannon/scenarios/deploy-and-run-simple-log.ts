import {
  type DeploySentTx,
  type NoirCompiledContract,
  waitForPXE,
} from "@aztec/aztec.js";
import { SimpleLoggingContract } from "../../artifacts/SimpleLogging.js";
import artifactJson from "../../contract-projects/SimpleLogging/target/simple_logging-SimpleLogging.json" assert { type: "json" };
import { logger } from "../../logger.js";
import { getAztecNodeClient, getPxe, getWallets } from "../pxe.js";
import {
  deployContract,
  logAndWaitForTx,
  registerContractClassArtifact,
} from "./utils/index.js";

export async function run() {
  logger.info("===== SIMPLE LOG CONTRACT =====");
  const pxe = getPxe();
  await waitForPXE(pxe);
  const namedWallets = getWallets();

  const deployerWallet = namedWallets.alice;

  const contractLoggingName = "Voting Contract";

  const contract = await deployContract({
    contractLoggingName,
    deployFn: (): DeploySentTx<SimpleLoggingContract> =>
      SimpleLoggingContract.deploy(deployerWallet).send(),
    node: getAztecNodeClient(),
  });

  registerContractClassArtifact(
    contractLoggingName,
    artifactJson as unknown as NoirCompiledContract,
    contract.instance.currentContractClassId.toString(),
    contract.instance.version
  ).catch((err) => {
    logger.error(err);
  });

  await logAndWaitForTx(
    contract.methods.increase_counter_public(1).send(),
    "Increase counter public"
  );
}
