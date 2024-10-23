import {
  type ChicmozL2BlockLight,
} from "@chicmoz-pkg/types";
import { blockSchema } from "~/components/blocks/blocks-schema";
import {
  type TxEffectTableSchema,
  getTxEffectTableObj,
} from "~/components/tx-effects/tx-effects-schema";
import { type useGetTxEffectsByBlockHeightRange } from "~/hooks";

export const mapLatestBlocks = (latestBlocks: ChicmozL2BlockLight[]) => {
  return latestBlocks.map((block) => {
    return blockSchema.parse({
      height: block.height,
      blockHash: block.hash,
      txEffectsLength: block.body.txEffects.length,
      totalFees: block.header.totalFees,
      timestamp: block.header.globalVariables.timestamp,
    });
  });
};

export const parseTxEffectsData = (
  txEffectsData: ReturnType<typeof useGetTxEffectsByBlockHeightRange>,
  latestBlocks: ChicmozL2BlockLight[]
) => {
  let isLoadingTxEffects = false;
  let txEffectsErrorMsg: string | undefined = undefined;

  let latestTxEffects: TxEffectTableSchema[] = [];
  txEffectsData.forEach((data, i) => {
    if (data.isLoading) isLoadingTxEffects = true;
    if (data.error) txEffectsErrorMsg = data.error.message;
    if (data.data) {
      latestTxEffects = latestTxEffects.concat(
        data.data.map((txEffect) =>
          getTxEffectTableObj(txEffect, latestBlocks[i])
        )
      );
    }
  });
  return {
    isLoadingTxEffects,
    txEffectsErrorMsg,
    latestTxEffects,
  };
};
