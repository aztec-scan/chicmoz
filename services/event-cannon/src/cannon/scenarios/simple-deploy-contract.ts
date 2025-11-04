import { DeploySentTx } from "@aztec/aztec.js/contracts";
import { logger } from "../../logger.js";
import { getAztecNodeClient, getAccounts, getWallet } from "../pxe.js";
import {
  deployContract,
  registerContractClassArtifact,
} from "./utils/index.js";
import { PrivateVotingContract } from "@aztec/noir-contracts.js/PrivateVoting";
import * as contractArtifactJson from "@aztec/noir-contracts.js/artifacts/private_voting_contract-PrivateVoting" with { type: "json" };

export async function run() {
  logger.info("===== SIMPLE DEPLOY CONTRACT =====");
  const namedAccounts = getAccounts();
  const wallet = getWallet();

  const deployerWallet = await namedAccounts.alice.getAccount();
  const votingAdmin = namedAccounts.alice.address;

  const sentTx = PrivateVotingContract.deploy(wallet, votingAdmin).send({
    from: deployerWallet.getAddress(),
  });

  const contractLoggingName = "Voting Contract";

  const contract = await deployContract({
    contractLoggingName,
    deployFn: (): DeploySentTx<PrivateVotingContract> => sentTx,
    node: getAztecNodeClient(),
  });

  logger.info(
    `conract currentContractClassId ${contract.instance.currentContractClassId.toString()}`,
  );
  logger.info(
    `conract originalContractClassId ${contract.instance.originalContractClassId.toString()}`,
  );

  registerContractClassArtifact(
    contractLoggingName,
    contractArtifactJson,
    contract.instance.currentContractClassId.toString(),
    contract.instance.version,
  ).catch((err) => {
    logger.error(err);
  });
}
