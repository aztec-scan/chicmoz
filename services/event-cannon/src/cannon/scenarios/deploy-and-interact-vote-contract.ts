import { Contract, DeploySentTx, Fr, waitForPXE } from "@aztec/aztec.js";
import {
  EasyPrivateVotingContract,
  EasyPrivateVotingContractArtifact,
} from "@aztec/noir-contracts.js/EasyPrivateVoting";
import * as contractArtifactJson from "@aztec/noir-contracts.js/artifacts/easy_private_voting_contract-EasyPrivateVoting" with { type: "json" };
import { logger } from "../../logger.js";
import { getAztecNodeClient, getPxe, getWallets } from "../pxe.js";
import {
  deployContract,
  logAndWaitForTx,
  verifyContractInstanceDeployment,
} from "./utils/index.js";

const contractId = "VotingContract";

export async function run() {
  logger.info(`===== ${contractId} =====`);
  const pxe = getPxe();
  await waitForPXE(pxe);
  const namedWallets = getWallets();

  const deployerWallet = namedWallets.alice;
  const votingAdmin = namedWallets.alice.getAddress();

  const contractLoggingName = contractId;
  const constructorArgs = [votingAdmin];

  const contract = await deployContract({
    contractLoggingName,
    deployFn: (): DeploySentTx<EasyPrivateVotingContract> =>
      EasyPrivateVotingContract.deploy(
        deployerWallet,
        constructorArgs[0],
      ).send(),
    broadcastWithWallet: deployerWallet, // NOTE: comment this out to not broadcast
    node: getAztecNodeClient(),
  });

  verifyContractInstanceDeployment({
    contractLoggingName,
    contractInstanceAddress: contract.address.toString(),
    verifyArgs: {
      artifactObj: contractArtifactJson,
      publicKeysString: contract.instance.publicKeys.toString(),
      deployer: contract.instance.deployer.toString(),
      salt: contract.instance.salt.toString(),
      constructorArgs: constructorArgs.map((arg) => arg.toString()),
    },
    deployerMetadata: {
      contractIdentifier: contractId,
      details: "Easy private voting contract",
      creatorName: "Event Cannon",
      creatorContact:
        "email: test@test.com, discord: test#1234, telegram: @test",
      appUrl: "https://aztec.network",
      repoUrl: "https://github.com/AztecProtocol/aztec-packages",
      reviewedAt: new Date(),
    },
  }).catch((err) => {
    logger.error(
      `Failed to verify contract instance deployment: ${(err as Error).stack}`,
    );
  });

  const votingContractAlice = await Contract.at(
    contract.address,
    EasyPrivateVotingContractArtifact,
    namedWallets.alice,
  );
  const votingContractBob = await Contract.at(
    contract.address,
    EasyPrivateVotingContractArtifact,
    namedWallets.bob,
  );
  const votingContractCharlie = await Contract.at(
    contract.address,
    EasyPrivateVotingContractArtifact,
    namedWallets.charlie,
  );

  const candidateA = new Fr(1);
  const candidateB = new Fr(2);

  await Promise.all([
    logAndWaitForTx(
      votingContractAlice.methods.cast_vote(candidateA).send(),
      "Cast vote 1 - candidate A",
    ),
    logAndWaitForTx(
      votingContractBob.methods.cast_vote(candidateA).send(),
      "Cast vote 2 - candidate A",
    ),
    await logAndWaitForTx(
      votingContractCharlie.methods.cast_vote(candidateB).send(),
      "Cast vote 3 - candidate B",
    ),
  ]);

  const votesA = (await contract.methods
    .get_vote(candidateA)
    .simulate()) as bigint;
  const votesB = (await contract.methods
    .get_vote(candidateB)
    .simulate()) as bigint;

  logger.info(`  Votes for candidate 1: ${votesA}`);
  logger.info(`  Votes for candidate 2: ${votesB}`);
}
