import {
  type UiBlockTable,
  type ChicmozL2TxEffectDeluxe,
  jsonStringify,
} from "@chicmoz-pkg/types";
import { blockSchema } from "~/components/blocks/blocks-schema";
import {
  getTxEffectTableObj,
  type TxEffectTableSchema,
} from "~/components/tx-effects/tx-effects-schema";

export const mapLatestBlocks = (latestBlocks?: UiBlockTable[]) => {
  if (!latestBlocks) {
    return undefined;
  }
  //This is her to parse Bigint to Number
  return latestBlocks.map((block) => {
    return blockSchema.parse(block);
  });
};

export const mapLatestTxEffects = (
  latestTxEffects: ChicmozL2TxEffectDeluxe[],
  latestBlocks: UiBlockTable[],
) => {
  console.log(jsonStringify(latestTxEffects));
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
