import {
  PrivateVotingContract,
  PrivateVotingContractArtifact,
} from "@aztec/noir-contracts.js/PrivateVoting";
import * as contractArtifactJson from "@aztec/noir-contracts.js/artifacts/private_voting_contract-PrivateVoting" with { type: "json" };
import { logger } from "../../logger.js";
import { getAccounts, getAztecNodeClient, getWallet } from "../pxe.js";
import {
  deployContract,
  logAndWaitForTx,
  verifyContractInstanceDeployment,
} from "./utils/index.js";
import { Contract, DeploySentTx } from "@aztec/aztec.js/contracts";
import { Fr } from "@aztec/aztec.js/fields";

const contractId = "VotingContract";

export async function run() {
  logger.info(`===== ${contractId} =====`);
  const namedWallets = getAccounts();
  const wallet = getWallet();

  const deployerWallet = namedWallets.alice;
  const votingAdmin = namedWallets.alice.address;

  const contractLoggingName = contractId;
  const constructorArgs = [votingAdmin];

  const { contract, instance: contractInstance } = await deployContract({
    contractLoggingName,
    deployFn: (): DeploySentTx<PrivateVotingContract> =>
      PrivateVotingContract.deploy(wallet, constructorArgs[0]).send({
        from: deployerWallet.address,
      }),
    broadcastWithWallet: wallet, // NOTE: comment this out to not broadcast
    node: getAztecNodeClient(),
  });

  // Fire-and-forget verification; do not block scenario execution.
  void verifyContractInstanceDeployment({
    contractLoggingName,
    contractInstanceAddress: contract.address.toString(),
    verifyArgs: {
      artifactObj: contractArtifactJson,
      publicKeysString: contractInstance.publicKeys.toString(),
      deployer: contractInstance.deployer.toString(),
      salt: contractInstance.salt.toString(),
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
  });

  const votingContractAlice = Contract.at(
    contract.address,
    PrivateVotingContractArtifact,
    wallet,
  );
  const votingContractBob = Contract.at(
    contract.address,
    PrivateVotingContractArtifact,
    wallet,
  );
  const votingContractCharlie = Contract.at(
    contract.address,
    PrivateVotingContractArtifact,
    wallet,
  );

  // Ensure the contract instance is registered with the PXE/wallet before
  // attempting private interactions (cast_vote is private).
  await wallet.registerContract(contractInstance);

  const candidateA = new Fr(1);
  const candidateB = new Fr(2);

  // Define election ID for this voting session
  const electionId = { id: new Fr(1) };

  // Run sequentially: PXE does not support concurrent job processing.
  await logAndWaitForTx(
    votingContractAlice.methods
      .cast_vote(electionId, candidateA)
      .send({ from: namedWallets.alice.address }),
    "Cast vote 1 - candidate A",
  );
  await logAndWaitForTx(
    votingContractBob.methods
      .cast_vote(electionId, candidateA)
      .send({ from: namedWallets.bob.address }),
    "Cast vote 2 - candidate A",
  );
  await logAndWaitForTx(
    votingContractCharlie.methods
      .cast_vote(electionId, candidateB)
      .send({ from: namedWallets.charlie.address }),
    "Cast vote 3 - candidate B",
  );

  const votesA = (await contract.methods
    .get_tally(electionId, candidateA)
    .simulate({ from: deployerWallet.address })) as bigint;
  const votesB = (await contract.methods
    .get_tally(electionId, candidateB)
    .simulate({ from: deployerWallet.address })) as bigint;

  logger.info(`  Votes for candidate 1: ${votesA}`);
  logger.info(`  Votes for candidate 2: ${votesB}`);
}
