// TODO: perhaps move this file to chicmoz-types?
import {
  ChicmozL2Block,
  ChicmozL2BlockFinalizationStatus,
  chicmozL2BlockSchema,
} from "@chicmoz-pkg/types";
import { parseTimeStamp } from "./time.js";
import { L2Block } from "@aztec/aztec.js/block";

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

export const blockFromBuffer = (hexEncodedBlock: string): L2Block => {
  return L2Block.fromBuffer(Buffer.from(hexEncodedBlock, "hex"));
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
      globalVariables: {
        ...blockWithTxEffectsHashesAdded.header.globalVariables,
        timestamp: parseTimeStamp(
          Number(
            blockWithTxEffectsHashesAdded.header.globalVariables.timestamp.toString(),
          ),
        ),
        coinbase:
          blockWithTxEffectsHashesAdded.header.globalVariables.coinbase.toString(),
      },
    },
  });
};
