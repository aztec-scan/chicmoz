import {
  type ChicmozL2BlockLight,
  type ChicmozL2TxEffectDeluxe,
} from "@chicmoz-pkg/types";
import { blockSchema } from "~/components/blocks/blocks-schema";
import { getTxEffectTableObj } from "~/components/tx-effects/tx-effects-schema";

export const mapLatestBlocks = (latestBlocks?: ChicmozL2BlockLight[]) => {
  if (!latestBlocks) {
    return undefined;
  }
  return latestBlocks.map((block) => {
    return blockSchema.parse({
      height: block.height,
      blockHash: block.hash,
      txEffectsLength: block.body.txEffects.length,
      timestamp: block.header.globalVariables.timestamp,
      blockStatus: block.finalizationStatus,
    });
  });
};

export const mapLatestTxEffects = (
  latestTxEffects: ChicmozL2TxEffectDeluxe[],
  latestBlocks?: ChicmozL2BlockLight[],
) => {
  // If blocks aren't available, show all transaction effects
  if (!latestBlocks || latestBlocks.length === 0) {
    return latestTxEffects.map((txEffect) => getTxEffectTableObj(txEffect));
  }

  const blockTxHashes = new Set<string>();
  latestBlocks.forEach((block) => {
    block.body.txEffects.forEach((tx) => {
      blockTxHashes.add(tx.txHash);
    });
  });

  const blockTxEffects = latestTxEffects
    .filter((txEffect) => blockTxHashes.has(txEffect.txHash))
    .map((txEffect) => {
      const matchingBlock = latestBlocks.find(
        (block) => block.height === txEffect.blockHeight,
      );
      return getTxEffectTableObj(txEffect, matchingBlock);
    });

  if (blockTxEffects.length > 0) {
    return blockTxEffects;
  }

  return latestTxEffects.map((txEffect) => {
    const matchingBlock = latestBlocks.find(
      (block) => block.height === txEffect.blockHeight,
    );
    return getTxEffectTableObj(txEffect, matchingBlock);
  });
};
