import {
  PrivateVotingContract,
  PrivateVotingContractArtifact,
} from "@aztec/noir-contracts.js/PrivateVoting";
import * as contractArtifactJson from "@aztec/noir-contracts.js/artifacts/private_voting_contract-PrivateVoting" with { type: "json" };
import { logger } from "../../logger.js";
import { getAccounts, getAztecNodeClient, getWallet } from "../pxe.js";
import {
  deployContract,
  simulateThenSend,
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

  // Initialize election before casting votes.
  // Run sequentially: PXE does not support concurrent job processing.
  await simulateThenSend({
    method: votingContractAlice.methods.cast_vote(candidateA),
    from: namedWallets.alice.address,
    additionalInfo: "Cast vote 1 - candidate A",
  });
  await simulateThenSend({
    method: votingContractBob.methods.cast_vote(candidateA),
    from: namedWallets.bob.address,
    additionalInfo: "Cast vote 2 - candidate A",
  });
  await simulateThenSend({
    method: votingContractCharlie.methods.cast_vote(candidateB),
    from: namedWallets.charlie.address,
    additionalInfo: "Cast vote 3 - candidate B",
  });

  const votesA = (await votingContractAlice.methods
    .get_vote(candidateA)
    .simulate({ from: deployerWallet.address })) as bigint;
  const votesB = (await votingContractAlice.methods
    .get_vote(candidateB)
    .simulate({ from: deployerWallet.address })) as bigint;

  logger.info(`  Votes for candidate 1: ${votesA}`);
  logger.info(`  Votes for candidate 2: ${votesB}`);
}
