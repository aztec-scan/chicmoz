import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { desc, eq, isNotNull, sql } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  body,
  l2Block,
  txEffect,
} from "../../database/schema/l2block/index.js";
import {
  l2ContractClassRegistered,
  l2ContractInstanceDeployed,
  l2PrivateFunction,
  l2UtilityFunction,
} from "../schema/index.js";

export const getABlock = async () => {
  const res = await db()
    .select({
      height: l2Block.height,
      hash: l2Block.hash,
    })
    .from(l2Block)
    .orderBy(desc(l2Block.height))
    .limit(1)
    .execute();
  if (res.length === 0) {
    return null;
  }
  return {
    height: Number(res[0].height),
    hash: res[0].hash,
  };
};

export const getABlockWithTxEffects = async () => {
  const dbInstance = db() as NodePgDatabase;
  const dbRes = await dbInstance
    .select({
      block: {
        height: l2Block.height,
        hash: l2Block.hash,
      },
      txEffects:
        sql<string>`COALESCE(json_agg(json_build_object('hash', ${txEffect.txHash}, 'index', ${txEffect.index})) FILTER (WHERE ${txEffect.txHash} IS NOT NULL), '[]'::json)`.as(
          "txEffects",
        ),
      txEffectCount: sql<number>`count(${txEffect.txHash})`.as("txEffectCount"),
    })
    .from(txEffect)
    .innerJoin(body, eq(txEffect.bodyId, body.id))
    .innerJoin(l2Block, eq(body.blockHash, l2Block.hash))
    .groupBy(l2Block.height, l2Block.hash)
    .orderBy(sql`count(${txEffect.txHash}) DESC, ${l2Block.height} DESC`)
    .limit(1)
    .execute();

  if (dbRes.length === 0) {
    return null;
  }

  const result = dbRes[0];
  return {
    block: {
      height: Number(result.block.height),
      hash: result.block.hash,
    },
    txEffects: (
      result.txEffects as unknown as Array<{ hash: string; index: string }>
    ).map((te) => ({
      hash: te.hash,
      index: Number(te.index),
    })),
  };
};

export const getSomeTxEffectWithPrivateLogs = async () => {
  const dbRes = await db()
    .select({
      txHash: txEffect.txHash,
    })
    .from(txEffect)
    .where(sql`jsonb_array_length(${txEffect.privateLogs}) > 0`)
    .limit(10)
    .execute();
  if (dbRes.length === 0) {
    return null;
  }
  return dbRes.map((row) => row.txHash);
};

export const getSomeTxEffectWithPublicLogs = async () => {
  const dbRes = await db()
    .select({
      hash: txEffect.txHash,
    })
    .from(txEffect)
    .where(sql`jsonb_array_length(${txEffect.publicLogs}) > 0`)
    .limit(10)
    .execute();
  if (dbRes.length === 0) {
    return null;
  }
  return dbRes.map((row) => row.hash);
};

export const getABlockWithContractInstances = async () => {
  const dbRes = await db()
    .select({
      l2Block: {
        height: l2Block.height,
        hash: l2Block.hash,
      },
      l2ContractInstanceDeployed: {
        address: l2ContractInstanceDeployed.address,
        version: l2ContractInstanceDeployed.version,
        classId: l2ContractInstanceDeployed.currentContractClassId,
      },
    })
    .from(l2Block)
    .innerJoin(
      l2ContractInstanceDeployed,
      eq(l2Block.hash, l2ContractInstanceDeployed.blockHash),
    )
    .limit(1)
    .execute();
  if (dbRes.length === 0) {
    return null;
  }
  return {
    block: {
      height: Number(dbRes[0].l2Block.height),
      hash: dbRes[0].l2Block.hash,
    },
    contractInstance: {
      address: dbRes[0].l2ContractInstanceDeployed.address,
      version: dbRes[0].l2ContractInstanceDeployed.version,
      classId: dbRes[0].l2ContractInstanceDeployed.classId,
    },
  };
};

export const getContractClassesWithArtifactJson = async () => {
  const dbRes = await db()
    .select({
      classId: l2ContractClassRegistered.contractClassId,
      version: l2ContractClassRegistered.version,
      artifactJson: l2ContractClassRegistered.artifactJson,
    })
    .from(l2ContractClassRegistered)
    .where(isNotNull(l2ContractClassRegistered.artifactJson))
    .limit(10)
    .execute();
  if (dbRes.length === 0) {
    return [];
  }
  return dbRes;
};

const getAL2PrivateFunction = async () => {
  const dbRes = await db()
    .select({
      currentContractClassId: l2PrivateFunction.contractClassId,
      functionSelector: l2PrivateFunction.privateFunction_selector_value,
    })
    .from(l2PrivateFunction)
    .limit(1)
    .execute();
  if (dbRes.length === 0) {
    return null;
  }
  return dbRes[0];
};

const getAL2UtilityFunction = async () => {
  const dbRes = await db()
    .select({
      contractClassId: l2UtilityFunction.contractClassId,
      functionSelector: l2UtilityFunction.utilityFunction_selector_value,
    })
    .from(l2UtilityFunction)
    .limit(1)
    .execute();
  if (dbRes.length === 0) {
    return null;
  }
  return dbRes[0];
};

export const getL2ContractFunctions = async () => {
  const [privateFunction, utilityFunction] = await Promise.all([
    getAL2PrivateFunction(),
    getAL2UtilityFunction(),
  ]);
  return {
    privateFunction,
    utilityFunction,
  };
};
