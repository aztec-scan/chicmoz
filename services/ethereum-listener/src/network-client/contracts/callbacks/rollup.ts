import {
  chicmozL1FeeJuicePortalDepositSchema,
  chicmozL1L2BlockProposedSchema,
  chicmozL1L2ProofVerifiedSchema,
  chicmozL1L2ValidatorSchema,
} from "@chicmoz-pkg/types";
import { z } from "zod";
import { emit } from "../../../events/index.js";
import { logger } from "../../../logger.js";
import { getBlockTimestamp, getPublicHttpClient } from "../../client/index.js";
import { getL1Contracts } from "../index.js";
import { RollupContract, FeeJuicePortalContract } from "../utils.js";
import { asyncForEach } from "./index.js";

// TODO: Move to a more appropriate location
const onError = (name: string) => (e: Error) => {
  logger.error(`${name}: ${e.stack}`);
};

// TODO: Move to a more appropriate location
type OnLogsCallbackWrapperArgs = {
  isFinalized: boolean;
  updateHeight: (height: bigint) => void;
  storeHeight: () => Promise<void>;
};

type L2BlockProposedGetEventsResult = Awaited<
  ReturnType<RollupContract["getEvents"]["CheckpointProposed"]>
>;

type L2BlockProposedEventParameters = {
  onLogs: (logs: L2BlockProposedGetEventsResult) => Promise<void>;
};

type L2ProofVerifiedGetEventsResult = Awaited<
  ReturnType<RollupContract["getEvents"]["L2ProofVerified"]>
>;

type L2ProofVerifiedEventParameters = {
  onLogs: (logs: L2ProofVerifiedGetEventsResult) => Promise<void>;
};

type DepositGetEventsResult = Awaited<
  ReturnType<RollupContract["getEvents"]["Deposit"]>
>;

type DepositEventParameters = {
  onLogs: (logs: DepositGetEventsResult) => Promise<void>;
};

type WithdrawInitiatedGetEventsResult = Awaited<
  ReturnType<RollupContract["getEvents"]["WithdrawInitiated"]>
>;

type WithdrawInitiatedEventParameters = {
  onLogs: (logs: WithdrawInitiatedGetEventsResult) => Promise<void>;
};

type WithdrawFinalisedGetEventsResult = Awaited<
  ReturnType<RollupContract["getEvents"]["WithdrawFinalized"]>
>;

type WithdrawFinalisedEventParameters = {
  onLogs: (logs: WithdrawFinalisedGetEventsResult) => Promise<void>;
};

type SlashedGetEventsResult = Awaited<
  ReturnType<RollupContract["getEvents"]["Slashed"]>
>;

type SlashedEventParameters = {
  onLogs: (logs: SlashedGetEventsResult) => Promise<void>;
};

type DepositToAztecPublicGetEventsResult = Awaited<
  ReturnType<FeeJuicePortalContract["getEvents"]["DepositToAztecPublic"]>
>;

type DepositToAztecPublicEventParameters = {
  onLogs: (logs: DepositToAztecPublicGetEventsResult) => Promise<void>;
};

type OnLogsWrapper<
  T extends
    | L2BlockProposedEventParameters
    | L2ProofVerifiedEventParameters
    | DepositEventParameters
    | WithdrawInitiatedEventParameters
    | WithdrawFinalisedEventParameters
    | SlashedEventParameters
    | DepositToAztecPublicEventParameters,
> = (args: OnLogsCallbackWrapperArgs) => T["onLogs"];

const l2BlockProposedOnLogs: OnLogsWrapper<L2BlockProposedEventParameters> =
  (wrapperArgs) => async (logs) => {
    let failureCount = 0;
    await asyncForEach(logs, async (log) => {
      try {
        await emit.l2BlockProposed(
          chicmozL1L2BlockProposedSchema.parse({
            l1ContractAddress: log.address,
            l1BlockNumber: log.blockNumber,
            l1BlockHash: log.blockHash,
            l1TransactionHash: log.transactionHash,
            isFinalized: wrapperArgs.isFinalized,
            l2BlockNumber: log.args.checkpointNumber,
            archive: log.args.archive,
            l1BlockTimestamp: await getBlockTimestamp(log.blockNumber),
          }),
        );
        wrapperArgs.updateHeight(log.blockNumber);
      } catch (e) {
        failureCount++;
        logger.error(
          `🎓 Rollup blockProposed failed for block ${log.blockNumber}: ${(e as Error).message}`,
        );
      }
    });
    await wrapperArgs.storeHeight();
    if (failureCount > 0) {
      logger.warn(
        `🎓 Rollup blockProposed batch completed with ${failureCount}/${logs.length} failures`,
      );
    }
  };

const l2BlockVerifiedOnLogs: OnLogsWrapper<L2ProofVerifiedEventParameters> =
  (wrapperArgs) => async (logs) => {
    let failureCount = 0;
    await asyncForEach(logs, async (log) => {
      try {
        await emit.l2ProofVerified(
          chicmozL1L2ProofVerifiedSchema.parse({
            l1ContractAddress: log.address,
            l1BlockNumber: log.blockNumber,
            l1BlockHash: log.blockHash,
            l1TransactionHash: log.transactionHash,
            isFinalized: wrapperArgs.isFinalized,
            l2BlockNumber: log.args.checkpointNumber,
            proverId: log.args.proverId,
            l1BlockTimestamp: await getBlockTimestamp(log.blockNumber),
          }),
        );
        wrapperArgs.updateHeight(log.blockNumber);
      } catch (e) {
        failureCount++;
        logger.error(
          `🎩 Rollup proofVerified failed for block ${log.blockNumber}: ${(e as Error).message}`,
        );
      }
    });
    await wrapperArgs.storeHeight();
    if (failureCount > 0) {
      logger.warn(
        `🎩 Rollup proofVerified batch completed with ${failureCount}/${logs.length} failures`,
      );
    }
  };

const depositOnLogs: OnLogsWrapper<DepositEventParameters> =
  (wrapperArgs) => async (logs) => {
    let failureCount = 0;
    await asyncForEach(logs, async (log) => {
      try {
        if (log.args.attester === undefined) {
          throw new Error("attester is undefined");
        }
        await getValidatorStateAndEmitUpdates({
          attester: log.args.attester,
          blockNumber: log.blockNumber,
        });
        wrapperArgs.updateHeight(log.blockNumber);
      } catch (e) {
        failureCount++;
        logger.error(
          `🏛 Rollup deposit failed for block ${log.blockNumber}: ${(e as Error).message}`,
        );
      }
    });
    await wrapperArgs.storeHeight();
    if (failureCount > 0) {
      logger.warn(
        `🏛 Rollup deposit batch completed with ${failureCount}/${logs.length} failures`,
      );
    }
  };

const withdrawInitiatedOnLogs: OnLogsWrapper<
  WithdrawInitiatedEventParameters
> = (wrapperArgs) => async (logs) => {
  let failureCount = 0;
  await asyncForEach(logs, async (log) => {
    try {
      if (log.args.attester === undefined) {
        throw new Error("attester is undefined");
      }
      await getValidatorStateAndEmitUpdates({
        attester: log.args.attester,
        blockNumber: log.blockNumber,
      });
      wrapperArgs.updateHeight(log.blockNumber);
    } catch (e) {
      failureCount++;
      logger.error(
        `🖨 Rollup withdrawInitiated failed for block ${log.blockNumber}: ${(e as Error).message}`,
      );
    }
  });
  await wrapperArgs.storeHeight();
  if (failureCount > 0) {
    logger.warn(
      `🖨 Rollup withdrawInitiated batch completed with ${failureCount}/${logs.length} failures`,
    );
  }
};

const withdrawFinalisedOnLogs: OnLogsWrapper<
  WithdrawFinalisedEventParameters
> = (wrapperArgs) => async (logs) => {
  let failureCount = 0;
  await asyncForEach(logs, async (log) => {
    try {
      if (log.args.attester === undefined) {
        throw new Error("attester is undefined");
      }
      await getValidatorStateAndEmitUpdates({
        attester: log.args.attester,
        blockNumber: log.blockNumber,
      });
      wrapperArgs.updateHeight(log.blockNumber);
    } catch (e) {
      failureCount++;
      logger.error(
        `💃 Rollup withdrawFinalised failed for block ${log.blockNumber}: ${(e as Error).message}`,
      );
    }
  });
  await wrapperArgs.storeHeight();
  if (failureCount > 0) {
    logger.warn(
      `💃 Rollup withdrawFinalised batch completed with ${failureCount}/${logs.length} failures`,
    );
  }
};

const slashedOnLogs: OnLogsWrapper<SlashedEventParameters> =
  (wrapperArgs) => async (logs) => {
    let failureCount = 0;
    await asyncForEach(logs, async (log) => {
      try {
        if (log.args.attester === undefined) {
          throw new Error("attester is undefined");
        }
        await getValidatorStateAndEmitUpdates({
          attester: log.args.attester,
          blockNumber: log.blockNumber,
        });
        wrapperArgs.updateHeight(log.blockNumber);
      } catch (e) {
        failureCount++;
        logger.error(
          `⚔ Rollup slashed failed for block ${log.blockNumber}: ${(e as Error).message}`,
        );
      }
    });
    await wrapperArgs.storeHeight();
    if (failureCount > 0) {
      logger.warn(
        `⚔ Rollup slashed batch completed with ${failureCount}/${logs.length} failures`,
      );
    }
  };

const getValidatorStateAndEmitUpdates = async ({
  attester,
  blockNumber,
}: {
  attester: `0x${string}`;
  blockNumber: bigint;
}) => {
  // NOTE: Below code requires an ETH full node to be able to query state at a certain block.

  logger.info(`=🤖=🤖= Getting validator state for ${attester}`);
  const { rollup } = await getL1Contracts();
  const attesterInfo = await getPublicHttpClient().readContract({
    address: rollup.address,
    abi: rollup.abi,
    functionName: "getAttesterView",
    blockNumber,
    args: [attester],
  });
  logger.info(`=🤖=🤖= attester info: ${JSON.stringify(attesterInfo, null, 2)}
  `);
  await emit.l1Validator(
    // NOTE: once we can query state at a certain block, we should refactor to send single validator updates
    z.array(chicmozL1L2ValidatorSchema).parse([
      {
        ...attesterInfo,
        rollupAddress: rollup.address,
        attester,
      },
    ]),
  );
};

const depositToAztecPublicOnLogs: OnLogsWrapper<DepositToAztecPublicEventParameters> =
  (wrapperArgs) => async (logs) => {
    let failureCount = 0;
    await asyncForEach(logs, async (log) => {
      try {
        const { to, amount, secretHash, key, index } = log.args;
        if (
          to === undefined ||
          amount === undefined ||
          secretHash === undefined ||
          key === undefined ||
          index === undefined
        ) {
          throw new Error(
            `DepositToAztecPublic: missing args in log ${log.transactionHash}:${log.logIndex}`,
          );
        }
        const l1BlockTimestamp = await getBlockTimestamp(log.blockNumber);

        // Fetch the L1 transaction to get msg.sender (the depositor).
        let l1Sender: string | null = null;
        if (log.transactionHash) {
          try {
            const tx = await getPublicHttpClient().getTransaction({
              hash: log.transactionHash,
            });
            l1Sender = tx.from;
          } catch (e) {
            logger.warn(
              `DepositToAztecPublic: could not fetch tx sender for ${log.transactionHash}: ${(e as Error).message}`,
            );
          }
        }

        await emit.feeJuicePortalDeposit(
          chicmozL1FeeJuicePortalDepositSchema.parse({
            l1ContractAddress: log.address,
            l1BlockNumber: log.blockNumber,
            l1BlockHash: log.blockHash,
            l1TransactionHash: log.transactionHash,
            l1LogIndex: log.logIndex,
            isFinalized: wrapperArgs.isFinalized,
            l1BlockTimestamp,
            l1Sender,
            to,
            amount,
            secretHash,
            key,
            index,
          }),
        );
        wrapperArgs.updateHeight(log.blockNumber);
      } catch (e) {
        failureCount++;
        logger.error(
          `🧃 FeeJuicePortal depositToAztecPublic failed for tx ${log.transactionHash}:${log.logIndex}: ${(e as Error).message}`,
        );
      }
    });
    await wrapperArgs.storeHeight();
    if (failureCount > 0) {
      logger.warn(
        `🧃 FeeJuicePortal depositToAztecPublic batch completed with ${failureCount}/${logs.length} failures`,
      );
    }
  };

export const l2BlockProposedEventCallbacks = (
  args: OnLogsCallbackWrapperArgs,
) => ({
  onError: onError("🎓 L2BlockProposed error"),
  onLogs: l2BlockProposedOnLogs(args),
});

export const l2ProofVerifiedEventCallbacks = (
  args: OnLogsCallbackWrapperArgs,
) => ({
  onError: onError("🎩 L2ProofVerified error"),
  onLogs: l2BlockVerifiedOnLogs(args),
});
export const depositEventCallbacks = (args: OnLogsCallbackWrapperArgs) => ({
  onError: onError("🏛 Deposit error"),
  onLogs: depositOnLogs(args),
});
export const withdrawInitiatedEventCallbacks = (
  args: OnLogsCallbackWrapperArgs,
) => ({
  onError: onError("🖨 WithdrawInitiated error"),
  onLogs: withdrawInitiatedOnLogs(args),
});
export const withdrawFinalisedEventCallbacks = (
  args: OnLogsCallbackWrapperArgs,
) => ({
  onError: onError("💃 WithdrawFinalised error"),
  onLogs: withdrawFinalisedOnLogs(args),
});
export const slashedEventCallbacks = (args: OnLogsCallbackWrapperArgs) => ({
  onError: onError("⚔ Slashed error"),
  onLogs: slashedOnLogs(args),
});

export const depositToAztecPublicEventCallbacks = (
  args: OnLogsCallbackWrapperArgs,
) => ({
  onError: onError("🧃 DepositToAztecPublic error"),
  onLogs: depositToAztecPublicOnLogs(args),
});
