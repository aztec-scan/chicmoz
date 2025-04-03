// TODO: perhaps move this file to chicmoz-types?
import { L2Block } from "@aztec/aztec.js";
import {
  ChicmozL2Block,
  ChicmozL2BlockFinalizationStatus,
  chicmozL2BlockSchema,
} from "@chicmoz-pkg/types";

const getTxEffectWithHashes = (txEffects: L2Block["body"]["txEffects"]) => {
  return txEffects.map((txEffect) => {
    return {
      ...txEffect,
      privateLogs: txEffect.privateLogs.map((log) => {
        return log.fields.map((f) => f.toJSON());
      }),
      contractClassLogsLength: txEffect.contractClassLogs.length,
      publicLogs: txEffect.publicLogs.map((log) => {
        return log.log.map((f) => f.toJSON());
      }),
      txHash: txEffect.txHash.toString(),
    };
  });
};

export const blockFromString = (stringifiedBlock: string): L2Block => {
  return L2Block.fromString(stringifiedBlock);
};

export const parseBlock = async (
  b: L2Block,
  finalizationStatus: ChicmozL2BlockFinalizationStatus
): Promise<ChicmozL2Block> => {
  const blockHash = await b.hash();

  const blockWithTxEffectsHashesAdded = {
    ...b,
    body: {
      ...b.body,
      txEffects: getTxEffectWithHashes(b.body.txEffects),
    },
  };
  // eslint-disable-next-line no-console
  return chicmozL2BlockSchema.parse({
    hash: blockHash.toString(),
    height: b.number,
    finalizationStatus,
    ...blockWithTxEffectsHashesAdded,
    header: {
      ...blockWithTxEffectsHashesAdded.header,
      totalFees: blockWithTxEffectsHashesAdded.header.totalFees.toBigInt(),
      contentCommitment: {
        ...blockWithTxEffectsHashesAdded.header.contentCommitment,
      },
      globalVariables: {
        ...blockWithTxEffectsHashesAdded.header.globalVariables,
        coinbase:
          blockWithTxEffectsHashesAdded.header.globalVariables.coinbase.toString(),
      },
    },
  });
};
