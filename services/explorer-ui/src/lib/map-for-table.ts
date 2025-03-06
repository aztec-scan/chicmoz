import { type ChicmozL2BlockLight, type ChicmozL2TxEffectDeluxe } from "@chicmoz-pkg/types";
import { blockSchema } from "~/components/blocks/blocks-schema";
import { getTxEffectTableObj, type TxEffectTableSchema } from "~/components/tx-effects/tx-effects-schema";

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
  latestBlocks: ChicmozL2BlockLight[],
) => {
  return latestTxEffects.reduce((acc, txEffect) => {
    const matchingBlock = latestBlocks.find(
      (block) => block.height === txEffect.blockHeight,
    );
    if (!matchingBlock) {
      return acc;
    }
    return acc.concat(getTxEffectTableObj(txEffect, matchingBlock));
  }, [] as TxEffectTableSchema[]);
};
