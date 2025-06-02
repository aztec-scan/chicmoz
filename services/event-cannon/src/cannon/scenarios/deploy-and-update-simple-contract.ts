import {
  type DeploySentTx,
  type NoirCompiledContract,
  waitForPXE,
} from "@aztec/aztec.js";
import {SimpleLoggingContract} from "../../artifacts/SimpleLogging-v1.js";
import {SimpleLoggingUpdateContract as SimpleLoggingV2} from "../../artifacts/SimpleLoggingUpdate.js";
import artifactJson from "../../contract-projects/SimpleLogging/target/simple_logging-SimpleLogging.json" with {type: "json"};
import artifactJsonV2 from "../../contract-projects/SimpleLoggingUpdate/target/simple_logging_update-SimpleLogging.json" with {type: "json"};
import {logger} from "../../logger.js";
import {getAztecNodeClient, getPxe, getWallets} from "../pxe.js";
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

  const contractLoggingName = "Voting Contract V1";

  const contractV1 = await deployContract({
    contractLoggingName,
    deployFn: (): DeploySentTx<SimpleLoggingContract> =>
      SimpleLoggingContract.deploy(deployerWallet).send(),
    node: getAztecNodeClient(),
  });

  registerContractClassArtifact(
    contractLoggingName,
    artifactJson as unknown as NoirCompiledContract,
    contractV1.instance.currentContractClassId.toString(),
    contractV1.instance.version
  ).catch((err) => {
    logger.error(err);
  });

  logger.info(`conract originalContractClassId ${contractV1.instance.originalContractClassId.toString()}`);
  logger.info(`conract currentContractClassId ${contractV1.instance.currentContractClassId.toString()}`);

  await logAndWaitForTx(
    contractV1.methods.increase_counter_public(1).send(),
    "Increase counter public"
  );

  const contractLoggingName2 = "Voting Contract V1";

  const contractV2 = await deployContract({
    contractLoggingName,
    deployFn: (): DeploySentTx<SimpleLoggingV2> =>
      SimpleLoggingV2.deploy(deployerWallet).send(),
    node: getAztecNodeClient(),
  });

  logger.info(`conract originalContractClassId ${contractV2.instance.originalContractClassId.toString()}`);
  logger.info(`conract currentContractClassId ${contractV2.instance.currentContractClassId.toString()}`);

  registerContractClassArtifact(
    contractLoggingName2,
    artifactJsonV2 as unknown as NoirCompiledContract,
    contractV2.instance.currentContractClassId.toString(),
    contractV2.instance.version
  ).catch((err) => {
    logger.error(err);
  });

  await logAndWaitForTx(
    contractV2.methods.decrease_counter_public(1).send(),
    "Increase counter public"
  );
}

