import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozSearchQuery,
  HexString,
  chicmozSearchResultsSchema,
  type ChicmozSearchResults,
} from "@chicmoz-pkg/types";
import { eq, or } from "drizzle-orm";
import {
  l2Block,
  l2ContractClassRegistered,
  l2ContractInstanceDeployed,
  txEffect,
} from "../../schema/index.js";

const getBlockHashByHeight = async (
  height: bigint
): Promise<ChicmozSearchResults["results"]["blocks"]> => {
  const res = await db()
    .select({
      hash: l2Block.hash,
    })
    .from(l2Block)
    .where(eq(l2Block.height, height))
    .execute();
  if (res.length === 0) { return []; }
  return [{ hash: res[0].hash }];
};

const matchBlock = async (
  hash: HexString
): Promise<ChicmozSearchResults["results"]["blocks"]> => {
  const res = await db()
    .select({
      hash: l2Block.hash,
    })
    .from(l2Block)
    .where(eq(l2Block.hash, hash))
    .execute();
  if (res.length === 0) { return []; }
  return [{ hash: res[0].hash }];
};

const matchTxEffect = async (
  hash: HexString
): Promise<ChicmozSearchResults["results"]["txEffects"]> => {
  const res = await db()
    .select({
      hash: txEffect.txHash,
    })
    .from(txEffect)
    .where(or(eq(txEffect.txHash, hash), eq(txEffect.txHash, hash)))
    .execute();
  if (res.length === 0) { return []; }
  return [{ txHash: res[0].hash }];
};

const matchContractClass = async (
  contractClassId: HexString
): Promise<ChicmozSearchResults["results"]["registeredContractClasses"]> => {
  const res = await db()
    .select({
      contractClassID: l2ContractClassRegistered.contractClassId,
      version: l2ContractClassRegistered.version,
    })
    .from(l2ContractClassRegistered)
    .where(eq(l2ContractClassRegistered.contractClassId, contractClassId))
    .execute();
  if (res.length === 0) { return []; }
  return [{ contractClassId: res[0].contractClassID, version: res[0].version }];
};

const matchContractInstance = async (
  contractInstanceId: HexString
): Promise<ChicmozSearchResults["results"]["contractInstances"]> => {
  const res = await db()
    .select({
      address: l2ContractInstanceDeployed.address,
    })
    .from(l2ContractInstanceDeployed)
    .where(eq(l2ContractInstanceDeployed.address, contractInstanceId))
    .execute();
  if (res.length === 0) { return []; }
  return [{ address: res[0].address }];
};

export const search = async (
  query: ChicmozSearchQuery["q"]
): Promise<ChicmozSearchResults> => {
  if (typeof query === "bigint") {
    return {
      searchPhrase: query.toString(),
      results: {
        blocks: await getBlockHashByHeight(query),
        txEffects: [],
        registeredContractClasses: [],
        contractInstances: [],
      },
    };
  }
  const [blocks, txEffects, registeredContractClasses, contractInstances] =
    await Promise.all([
      matchBlock(query),
      matchTxEffect(query),
      matchContractClass(query),
      matchContractInstance(query),
    ]);

  return chicmozSearchResultsSchema.parse({
    searchPhrase: query,
    results: {
      blocks,
      txEffects,
      registeredContractClasses,
      contractInstances,
    },
  });
};
