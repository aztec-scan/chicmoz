import {
  chicmozL1L2BlockProposedSchema,
  chicmozL1L2ProofVerifiedSchema,
} from "@chicmoz-pkg/types";
import { emit } from "../../../events/index.js";
import { logger } from "../../../logger.js";
import { getBlockTimestamp } from "../../client/index.js";
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

type OnLogsWrapper<
  T extends L2BlockProposedEventParameters | L2ProofVerifiedEventParameters,
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
