import {
  chicmozL2BlockSchema,
  chicmozL2PendingTxSchema,
  chicmozL2TxEffectSchema,
  type ChicmozL2Block,
  type ChicmozL2BlockLight,
  type ChicmozL2PendingTx,
  type WebsocketUpdateMessageReceiver,
} from "@chicmoz-pkg/types";
import { type useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { queryKeyGenerator, statsKey } from "../api/utils";

export const updateBlock = (
  queryClient: ReturnType<typeof useQueryClient>,
  block: ChicmozL2BlockLight,
) => {
  queryClient.setQueryData(queryKeyGenerator.latestBlock, block);
  queryClient.setQueryData(
    queryKeyGenerator.latestBlocks,
    (oldData: ChicmozL2BlockLight[] | undefined) => {
      if (!oldData) {
        return [block];
      }
      if (oldData.find((b) => b.hash === block.hash)) {
        return oldData;
      }
      return [...oldData, block].sort((a, b) => Number(b.height - a.height));
    },
  );
};

export const updateTxEffects = (
  queryClient: ReturnType<typeof useQueryClient>,
  block: ChicmozL2Block,
) => {
  const txEffects = block.body.txEffects.map((txEffect) => {
    const effect = chicmozL2TxEffectSchema.parse(txEffect);
    queryClient.setQueryData(queryKeyGenerator.txEffectByHash(effect.txHash), {
      ...effect,
      blockHeight: block.height,
      timestamp: block.header.globalVariables.timestamp,
    });
    return effect;
  });
  queryClient.setQueryData(
    queryKeyGenerator.txEffectsByBlockHeight(block.height),
    txEffects,
  );
};

export const invalidateStats = async (
  queryClient: ReturnType<typeof useQueryClient>,
) => queryClient.invalidateQueries({ queryKey: [statsKey], exact: false });

export const invalidateContracts = async (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeyGenerator.latestContractClasses(),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeyGenerator.latestContractInstances,
    }),
  ]);
};

export const handleBlock = async (
  queryClient: ReturnType<typeof useQueryClient>,
  blockData: ChicmozL2Block,
) => {
  const block = chicmozL2BlockSchema.parse(blockData);
  updateBlock(queryClient, block);
  updateTxEffects(queryClient, block);
  await Promise.all([
    invalidateStats(queryClient),
    invalidateContracts(queryClient),
  ]);
};

export const updatePendingTxs = (
  queryClient: ReturnType<typeof useQueryClient>,
  txs: ChicmozL2PendingTx[],
) => {
  queryClient.setQueryData(
    queryKeyGenerator.pendingTxs,
    (oldData: ChicmozL2PendingTx[] | undefined) => {
      if (!oldData) {
        return txs;
      }
      return [...oldData, ...txs]
        .filter(
          (tx, index, self) =>
            self.findIndex((t) => t.hash === tx.hash) === index,
        )
        .sort((a, b) => b.birthTimestamp - a.birthTimestamp);
    },
  );
};

export const handlePendingTxs = (
  queryClient: ReturnType<typeof useQueryClient>,
  txsData: ChicmozL2PendingTx[],
) => {
  const txs = z.array(chicmozL2PendingTxSchema).parse(txsData);
  updatePendingTxs(queryClient, txs);
};

export const handleWebSocketMessage = async (
  queryClient: ReturnType<typeof useQueryClient>,
  data: string,
) => {
  const update: WebsocketUpdateMessageReceiver = JSON.parse(
    data,
  ) as WebsocketUpdateMessageReceiver;
  if (update.block) {
    await handleBlock(queryClient, update.block);
  }
  if (update.txs) {
    handlePendingTxs(queryClient, update.txs);
  }
};
