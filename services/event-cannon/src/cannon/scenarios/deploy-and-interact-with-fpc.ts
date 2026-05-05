import {
  PrivateVotingContract,
  PrivateVotingContractArtifact,
} from "@aztec/noir-contracts.js/PrivateVoting";
import { SponsoredFPCContract } from "@aztec/noir-contracts.js/SponsoredFPC";
import { SponsoredFeePaymentMethod } from "@aztec/aztec.js/fee";
import { Contract, DeployMethod } from "@aztec/aztec.js/contracts";
import { Fr } from "@aztec/aztec.js/fields";
import { logger } from "../../logger.js";
import { getAccounts, getAztecNodeClient, getWallet } from "../pxe.js";
import {
  deployContract,
  logAndWaitForTx,
  simulateThenSend,
} from "./utils/index.js";

const contractId = "FPCScenario";

export async function run() {
  logger.info(`===== ${contractId} =====`);
  const namedWallets = getAccounts();
  const wallet = getWallet();

  // -----------------------------------------------------------------------
  // 1. Deploy SponsoredFPCContract (Alice pays via fee_juice)
  //    The FPC is pre-funded in the sandbox via its initial balance,
  //    so it can sponsor gas for other transactions unconditionally.
  // -----------------------------------------------------------------------
  logger.info("Deploying SponsoredFPCContract...");
  const { contract: fpcContract } = await deployContract({
    contractLoggingName: "SponsoredFPC",
    deployFn: (): DeployMethod<SponsoredFPCContract> =>
      SponsoredFPCContract.deploy(wallet),
    from: namedWallets.alice.address,
    node: getAztecNodeClient(),
  });
  logger.info(`SponsoredFPC deployed at ${fpcContract.address.toString()}`);

  // -----------------------------------------------------------------------
  // 2. Deploy PrivateVotingContract (Alice pays via fee_juice)
  //    Re-using the same contract already exercised in other scenarios;
  //    a fresh deploy keeps this scenario fully self-contained.
  // -----------------------------------------------------------------------
  logger.info("Deploying PrivateVotingContract for FPC scenario...");
  const { contract: votingContract, instance: votingInstance } =
    await deployContract({
      contractLoggingName: "VotingContractForFPC",
      deployFn: (): DeployMethod<PrivateVotingContract> =>
        PrivateVotingContract.deploy(wallet, namedWallets.alice.address),
      from: namedWallets.alice.address,
      node: getAztecNodeClient(),
    });
  logger.info(
    `PrivateVotingContract deployed at ${votingContract.address.toString()}`,
  );

  // Register the contract instance with the PXE so private interactions work.
  await wallet.registerContract(votingInstance);

  const electionId = { id: new Fr(42) };
  const candidateA = new Fr(1);

  // -----------------------------------------------------------------------
  // 3. Start the election — Alice, standard fee_juice payment
  // -----------------------------------------------------------------------
  const votingContractAlice = Contract.at(
    votingContract.address,
    PrivateVotingContractArtifact,
    wallet,
  );

  await simulateThenSend({
    method: votingContractAlice.methods.start_vote(electionId),
    from: namedWallets.alice.address,
    additionalInfo: "FPC scenario: start_vote",
  });

  // -----------------------------------------------------------------------
  // 4. Cast a vote sponsored by the FPC — this is the key tx for this scenario.
  //    Using SponsoredFeePaymentMethod means the FPC pays the gas, so:
  //      - tx.getStats().feePaymentMethod === 'fpc'
  //      - feePayer in the pending tx will be the FPC contract address
  // -----------------------------------------------------------------------
  logger.info("Casting FPC-sponsored vote (Bob, fee paid by SponsoredFPC)...");

  const votingContractBob = Contract.at(
    votingContract.address,
    PrivateVotingContractArtifact,
    wallet,
  );

  const feePaymentMethod = new SponsoredFeePaymentMethod(fpcContract.address);

  const castVoteInteraction = votingContractBob.methods.cast_vote(
    electionId,
    candidateA,
  );

  // Simulate first to catch errors early, then send with FPC fee payment.
  await castVoteInteraction.simulate({ from: namedWallets.bob.address });

  const receipt = await logAndWaitForTx(
    castVoteInteraction.send({
      from: namedWallets.bob.address,
      fee: { paymentMethod: feePaymentMethod },
    }),
    "FPC-sponsored cast_vote (Bob)",
  );

  logger.info(
    `FPC-sponsored cast_vote mined — txHash: ${receipt.txHash.toString()}` +
      ` | feePaymentMethod expected: 'fpc'` +
      ` | feePayer expected: ${fpcContract.address.toString()}`,
  );
}
