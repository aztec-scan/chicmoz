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
      privateLogs: txEffect.privateLogs.map((log) => ({
        fields: log.fields,
        emittedLength: log.emittedLength,
      })),
      publicLogs: txEffect.publicLogs.map((log) => ({
        contractAddress: log.contractAddress,
        fields: log.fields,
        emittedLength: log.emittedLength,
      })),
      contractClassLogs: txEffect.contractClassLogs.map((log) => ({
        contractAddress: log.contractAddress,
        fields: log.fields.fields,
        emittedLength: log.emittedLength,
      })),
      txHash: txEffect.txHash.toString(),
    };
  });
};

export const blockFromString = (stringifiedBlock: string): L2Block => {
  return L2Block.fromString(stringifiedBlock);
};

export const parseBlock = async (
  b: L2Block,
  finalizationStatus: ChicmozL2BlockFinalizationStatus,
): Promise<ChicmozL2Block> => {
  const blockHash = await b.hash();

  const blockWithTxEffectsHashesAdded = {
    ...b,
    body: {
      ...b.body,
      txEffects: getTxEffectWithHashes(b.body.txEffects),
    },
  };
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
        blobsHash:
          blockWithTxEffectsHashesAdded.header.contentCommitment.blobsHash.toString(),
        inHash:
          blockWithTxEffectsHashesAdded.header.contentCommitment.inHash.toString(),
        outHash:
          blockWithTxEffectsHashesAdded.header.contentCommitment.outHash.toString(),
      },
      globalVariables: {
        ...blockWithTxEffectsHashesAdded.header.globalVariables,
        coinbase:
          blockWithTxEffectsHashesAdded.header.globalVariables.coinbase.toString(),
      },
    },
  });
};
