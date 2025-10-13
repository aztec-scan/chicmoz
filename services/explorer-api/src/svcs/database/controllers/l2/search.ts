import { l1Schemas } from "@chicmoz-pkg/database-registry";
import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozL2TxEffect,
  ChicmozSearchQuery,
  HexString,
  chicmozL2TxEffectSchema,
  chicmozSearchResultsSchema,
  type ChicmozSearchResults,
} from "@chicmoz-pkg/types";
import { and, eq, or, sql, isNull } from "drizzle-orm";
import { z } from "zod";
import {
  droppedTx,
  l2Block,
  l2ContractClassRegistered,
  l2ContractInstanceDeployed,
  l2Tx,
  txEffect,
} from "../../schema/index.js";
import { CURRENT_ROLLUP_VERSION } from "@chicmoz-pkg/types";

const { 
  l1L2ValidatorTable
} = l1Schemas

const getBlockHashByHeight = async (
  height: bigint,
): Promise<ChicmozSearchResults["results"]["blocks"]> => {
  const res = await db()
    .select({
      hash: l2Block.hash,
    })
    .from(l2Block)
    .where(
      and(
        eq(l2Block.height, height),
        isNull(l2Block.orphan_timestamp),
        eq(l2Block.version, parseInt(CURRENT_ROLLUP_VERSION)),
      ),
    )
    .execute();
  if (res.length === 0) {
    return [];
  }
  return [{ hash: res[0].hash }];
};

const matchBlock = async (
  hash: HexString,
): Promise<ChicmozSearchResults["results"]["blocks"]> => {
  const res = await db()
    .select({
      hash: l2Block.hash,
    })
    .from(l2Block)
    .where(eq(l2Block.hash, hash))
    .execute();
  if (res.length === 0) {
    return [];
  }
  return [{ hash: res[0].hash }];
};

const matchTxEffect = async (
  hash: HexString,
): Promise<ChicmozSearchResults["results"]["txEffects"]> => {
  const res = await db()
    .select({
      hash: txEffect.txHash,
    })
    .from(txEffect)
    .where(or(eq(txEffect.txHash, hash), eq(txEffect.txHash, hash)))
    .execute();
  if (res.length === 0) {
    return [];
  }
  return [{ txHash: res[0].hash }];
};

const matchPendingTx = async (
  hash: HexString,
): Promise<ChicmozSearchResults["results"]["pendingTx"]> => {
  const res = await db()
    .select({
      hash: l2Tx.txHash,
    })
    .from(l2Tx)
    .where(or(eq(l2Tx.txHash, hash), eq(l2Tx.txHash, hash)))
    .execute();
  if (res.length === 0) {
    return [];
  }
  return [{ txHash: res[0].hash }];
};

const matchDroppedTx = async (
  hash: HexString,
): Promise<ChicmozSearchResults["results"]["pendingTx"]> => {
  const res = await db()
    .select({
      hash: droppedTx.txHash,
    })
    .from(droppedTx)
    .where(or(eq(droppedTx.txHash, hash), eq(droppedTx.txHash, hash)))
    .execute();
  if (res.length === 0) {
    return [];
  }
  return [{ txHash: res[0].hash }];
};

const matchValidator = async (
  hash: HexString,
): Promise<ChicmozSearchResults["results"]["validators"]> => {
  const res = await db()
    .select({
      attester: l1L2ValidatorTable.attester,
    })
    .from(l1L2ValidatorTable)
    .where(eq(l1L2ValidatorTable.attester, hash))
    .execute();
  if (res.length === 0) {
    return [];
  }
  return [{ validatorAddress: res[0].attester }];
};

const matchContractClass = async (
  contractClassId: HexString,
): Promise<ChicmozSearchResults["results"]["registeredContractClasses"]> => {
  const res = await db()
    .select({
      contractClassID: l2ContractClassRegistered.contractClassId,
      version: l2ContractClassRegistered.version,
    })
    .from(l2ContractClassRegistered)
    .where(eq(l2ContractClassRegistered.contractClassId, contractClassId))
    .execute();
  if (res.length === 0) {
    return [];
  }
  return [{ contractClassId: res[0].contractClassID, version: res[0].version }];
};

const matchContractInstance = async (
  contractInstanceId: HexString,
): Promise<ChicmozSearchResults["results"]["contractInstances"]> => {
  const res = await db()
    .select({
      address: l2ContractInstanceDeployed.address,
    })
    .from(l2ContractInstanceDeployed)
    .where(eq(l2ContractInstanceDeployed.address, contractInstanceId))
    .execute();
  if (res.length === 0) {
    return [];
  }
  return [{ address: res[0].address }];
};

export const searchPublicLogs = async ({
  frLogEntry,
  index,
}: {
  frLogEntry: string;
  index: number;
}): Promise<ChicmozL2TxEffect["txHash"][]> => {
  const condition = sql`${txEffect.publicLogs}::text LIKE ${
    "%" + frLogEntry + "%"
  }`;
  const res = await db()
    .select({
      hash: txEffect.txHash,
      logs: txEffect.publicLogs,
    })
    .from(txEffect)
    .where(condition)
    .execute();
  if (res.length === 0) {
    return [];
  }
  const parsed = z
    .array(
      z.object({
        hash: chicmozL2TxEffectSchema.shape.txHash,
        logs: chicmozL2TxEffectSchema.shape.publicLogs,
      }),
    )
    .parse(res);
  return parsed
    .filter((txEffect) => {
      return txEffect.logs.some((log) => {
        return log.fields[index] === frLogEntry;
      });
    })
    .map((txEffect) => txEffect.hash);
};

export const search = async (
  query: ChicmozSearchQuery["q"],
): Promise<ChicmozSearchResults> => {
  if (typeof query === "bigint") {
    return {
      searchPhrase: query.toString(),
      results: {
        blocks: await getBlockHashByHeight(query),
        txEffects: [],
        droppedTx: [],
        pendingTx: [],
        registeredContractClasses: [],
        contractInstances: [],
        validators: [],
      },
    };
  }
  const [
    blocks,
    txEffects,
    pendingTx,
    droppedTx,
    registeredContractClasses,
    contractInstances,
    validators,
  ] = await Promise.all([
    matchBlock(query),
    matchTxEffect(query),
    matchPendingTx(query),
    matchDroppedTx(query),
    matchContractClass(query),
    matchContractInstance(query),
    matchValidator(query),
  ]);

  return chicmozSearchResultsSchema.parse({
    searchPhrase: query,
    results: {
      blocks,
      txEffects,
      pendingTx,
      droppedTx,
      registeredContractClasses,
      contractInstances,
      validators,
    },
  });
};
