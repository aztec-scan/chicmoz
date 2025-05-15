import {
  chicmozL1L2BlockProposedSchema,
  chicmozL1L2ProofVerifiedSchema,
  chicmozL1L2ValidatorSchema,
} from "@chicmoz-pkg/types";
import { z } from "zod";
import { emit } from "../../../events/index.js";
import { logger } from "../../../logger.js";
import { getBlockTimestamp, getPublicHttpClient } from "../../client/index.js";
import { getL1Contracts } from "../index.js";
import { RollupContract } from "../utils.js";
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
  ReturnType<RollupContract["getEvents"]["L2BlockProposed"]>
>;

type L2BlockProposedWatchEventParameters = Parameters<
  RollupContract["watchEvent"]["L2BlockProposed"]
>[1];

type L2BlockProposedEventParameters = {
  onLogs:
    | ((logs: L2BlockProposedGetEventsResult) => void)
    | L2BlockProposedWatchEventParameters["onLogs"];
};

type L2ProofVerifiedGetEventsResult = Awaited<
  ReturnType<RollupContract["getEvents"]["L2ProofVerified"]>
>;

type L2ProofVerifiedWatchEventParameters = Parameters<
  RollupContract["watchEvent"]["L2ProofVerified"]
>[1];

type L2ProofVerifiedEventParameters = {
  onLogs:
    | ((logs: L2ProofVerifiedGetEventsResult) => void)
    | L2ProofVerifiedWatchEventParameters["onLogs"];
};

type DepositGetEventsResult = Awaited<
  ReturnType<RollupContract["getEvents"]["Deposit"]>
>;

type DepositWatchEventParameters = Parameters<
  RollupContract["watchEvent"]["Deposit"]
>[1];

type DepositEventParameters = {
  onLogs:
    | ((logs: DepositGetEventsResult) => void)
    | DepositWatchEventParameters["onLogs"];
};

type WithdrawInitiatedGetEventsResult = Awaited<
  ReturnType<RollupContract["getEvents"]["WithdrawInitiated"]>
>;

type WithdrawInitiatedWatchEventParameters = Parameters<
  RollupContract["watchEvent"]["WithdrawInitiated"]
>[1];

type WithdrawInitiatedEventParameters = {
  onLogs:
    | ((logs: WithdrawInitiatedGetEventsResult) => void)
    | WithdrawInitiatedWatchEventParameters["onLogs"];
};

type WithdrawFinalisedGetEventsResult = Awaited<
  ReturnType<RollupContract["getEvents"]["WithdrawFinalised"]>
>;

type WithdrawFinalisedWatchEventParameters = Parameters<
  RollupContract["watchEvent"]["WithdrawFinalised"]
>[1];

type WithdrawFinalisedEventParameters = {
  onLogs:
    | ((logs: WithdrawFinalisedGetEventsResult) => void)
    | WithdrawFinalisedWatchEventParameters["onLogs"];
};

type SlashedGetEventsResult = Awaited<
  ReturnType<RollupContract["getEvents"]["Slashed"]>
>;

type SlashedWatchEventParameters = Parameters<
  RollupContract["watchEvent"]["Slashed"]
>[1];

type SlashedEventParameters = {
  onLogs:
    | ((logs: SlashedGetEventsResult) => void)
    | SlashedWatchEventParameters["onLogs"];
};

type OnLogsWrapper<
  T extends
    | L2BlockProposedEventParameters
    | L2ProofVerifiedEventParameters
    | DepositEventParameters
    | WithdrawInitiatedEventParameters
    | WithdrawFinalisedEventParameters
    | SlashedEventParameters,
> = (args: OnLogsCallbackWrapperArgs) => T["onLogs"];

const l2BlockProposedOnLogs: OnLogsWrapper<L2BlockProposedEventParameters> =
  (wrapperArgs) => (logs) => {
    asyncForEach(logs, async (log) => {
      await emit.l2BlockProposed(
        chicmozL1L2BlockProposedSchema.parse({
          l1ContractAddress: log.address,
          l1BlockNumber: log.blockNumber,
          l1BlockHash: log.blockHash,
          isFinalized: wrapperArgs.isFinalized,
          l2BlockNumber: log.args.blockNumber,
          archive: log.args.archive,
          l1BlockTimestamp: await getBlockTimestamp(log.blockNumber),
        }),
      );
      wrapperArgs.updateHeight(log.blockNumber);
    })
      .catch((e) => {
        logger.error(`🎓 Rollup blockProposed: ${(e as Error).stack}`);
      })
      .finally(() => {
        wrapperArgs.storeHeight().catch((e) => {
          logger.error(
            `🎓 Rollup blockProposed (Store height): ${(e as Error).stack}`,
          );
        });
      });
  };

const l2BlockVerifiedOnLogs: OnLogsWrapper<L2ProofVerifiedEventParameters> =
  (wrapperArgs) => (logs) => {
    asyncForEach(logs, async (log) => {
      await emit.l2ProofVerified(
        chicmozL1L2ProofVerifiedSchema.parse({
          l1ContractAddress: log.address,
          l1BlockNumber: log.blockNumber,
          l1BlockHash: log.blockHash,
          isFinalized: wrapperArgs.isFinalized,
          l2BlockNumber: log.args.blockNumber,
          proverId: log.args.proverId,
          l1BlockTimestamp: await getBlockTimestamp(log.blockNumber),
        }),
      );
      wrapperArgs.updateHeight(log.blockNumber);
    })
      .catch((e) => {
        logger.error(`🎩 Rollup blockProposed: ${(e as Error).stack}`);
      })
      .finally(() => {
        wrapperArgs.storeHeight().catch((e) => {
          logger.error(
            `🎩 Rollup blockProposed (Store height): ${(e as Error).stack}`,
          );
        });
      });
  };

const depositOnLogs: OnLogsWrapper<DepositEventParameters> =
  (wrapperArgs) => (logs) => {
    asyncForEach(logs, async (log) => {
      if (log.args.attester === undefined) {
        throw new Error("attester is undefined");
      }
      await getValidatorStateAndEmitUpdates({
        attester: log.args.attester,
        blockNumber: log.blockNumber,
      });
      wrapperArgs.updateHeight(log.blockNumber);
    })
      .catch((e) => {
        logger.error(`🏛 Rollup deposit: ${(e as Error).stack}`);
      })
      .finally(() => {
        wrapperArgs.storeHeight().catch((e) => {
          logger.error(
            `🏛 Rollup deposit (Store height): ${(e as Error).stack}`,
          );
        });
      });
  };

const withdrawInitiatedOnLogs: OnLogsWrapper<
  WithdrawInitiatedEventParameters
> = (wrapperArgs) => (logs) => {
  asyncForEach(logs, async (log) => {
    if (log.args.attester === undefined) {
      throw new Error("attester is undefined");
    }
    await getValidatorStateAndEmitUpdates({
      attester: log.args.attester,
      blockNumber: log.blockNumber,
    });
    wrapperArgs.updateHeight(log.blockNumber);
  })
    .catch((e) => {
      logger.error(`🖨 Rollup withdrawInitiated: ${(e as Error).stack}`);
    })
    .finally(() => {
      wrapperArgs.storeHeight().catch((e) => {
        logger.error(
          `🖨 Rollup withdrawInitiated (Store height): ${(e as Error).stack}`,
        );
      });
    });
};

const withdrawFinalisedOnLogs: OnLogsWrapper<
  WithdrawFinalisedEventParameters
> = (wrapperArgs) => (logs) => {
  asyncForEach(logs, async (log) => {
    if (log.args.attester === undefined) {
      throw new Error("attester is undefined");
    }
    await getValidatorStateAndEmitUpdates({
      attester: log.args.attester,
      blockNumber: log.blockNumber,
    });
    wrapperArgs.updateHeight(log.blockNumber);
  })
    .catch((e) => {
      logger.error(`💃 Rollup withdrawFinalised: ${(e as Error).stack}`);
    })
    .finally(() => {
      wrapperArgs.storeHeight().catch((e) => {
        logger.error(
          `💃 Rollup withdrawFinalised (Store height): ${(e as Error).stack}`,
        );
      });
    });
};

const slashedOnLogs: OnLogsWrapper<SlashedEventParameters> =
  (wrapperArgs) => (logs) => {
    asyncForEach(logs, async (log) => {
      if (log.args.attester === undefined) {
        throw new Error("attester is undefined");
      }
      await getValidatorStateAndEmitUpdates({
        attester: log.args.attester,
        blockNumber: log.blockNumber,
      });
      wrapperArgs.updateHeight(log.blockNumber);
    })
      .catch((e) => {
        logger.error(`⚔ Rollup slashed: ${(e as Error).stack}`);
      })
      .finally(() => {
        wrapperArgs.storeHeight().catch((e) => {
          logger.error(
            `⚔ Rollup slashed (Store height): ${(e as Error).stack}`,
          );
        });
      });
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
    functionName: "getInfo",
    blockNumber,
    args: [attester],
  });
  logger.info(`=🤖=🤖= attester info: ${JSON.stringify(attesterInfo, null, 2)}
  `);
  await emit.l1Validator( // NOTE: once we can query state at a certain block, we should refactor to send single validator updates
    z.array(chicmozL1L2ValidatorSchema).parse({
      ...attesterInfo,
      rollupAddress: rollup.address,
      attester,
    }),
  );
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
