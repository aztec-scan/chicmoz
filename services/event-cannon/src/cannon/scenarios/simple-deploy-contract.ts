import { DeploySentTx, waitForPXE } from "@aztec/aztec.js";
import { logger } from "../../logger.js";
import { getAztecNodeClient, getPxe, getWallets } from "../pxe.js";
import {
  deployContract,
  registerContractClassArtifact,
} from "./utils/index.js";
import { EasyPrivateVotingContract } from "@aztec/noir-contracts.js/EasyPrivateVoting";
import * as contractArtifactJson from "@aztec/noir-contracts.js/artifacts/easy_private_voting_contract-EasyPrivateVoting" assert { type: "json" };

export async function run() {
  logger.info("===== SIMPLE DEPLOY CONTRACT =====");
  const pxe = getPxe();
  await waitForPXE(pxe);
  const namedWallets = getWallets();

  const deployerWallet = namedWallets.alice;
  const votingAdmin = namedWallets.alice.getAddress();

  const sentTx = EasyPrivateVotingContract.deploy(
    deployerWallet,
    votingAdmin
  ).send();

  const contractLoggingName = "Voting Contract";

  const contract = await deployContract({
    contractLoggingName,
    deployFn: (): DeploySentTx<EasyPrivateVotingContract> => sentTx,
    node: getAztecNodeClient(),
  });

  logger.info(`conract currentContractClassId ${contract.instance.currentContractClassId.toString()}`);
  logger.info(`conract originalContractClassId ${contract.instance.originalContractClassId.toString()}`);


  registerContractClassArtifact(
    contractLoggingName,
    contractArtifactJson,
    contract.instance.currentContractClassId.toString(),
    contract.instance.version
  ).catch((err) => {
    logger.error(err);
  });
}
