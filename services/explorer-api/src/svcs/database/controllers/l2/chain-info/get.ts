import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  type ChicmozChainInfo,
  type L2NetworkId,
  NODE_ENV,
  NodeEnv,
  chicmozChainInfoSchema,
} from "@chicmoz-pkg/types";
import { and, desc, eq } from "drizzle-orm";
import { CURRENT_ROLLUP_VERSION_BIGINT } from "../../../../../constants/versions.js";
import { l2ChainInfoTable } from "../../../schema/l2/chain-info.js";

type ChicmozChainInfoWithStakingAsset = ChicmozChainInfo & {
  stakingAssetSymbol?: string;
  stakingAssetDecimals?: number;
};

export async function getL2ChainInfo(
  l2NetworkId: L2NetworkId,
): Promise<ChicmozChainInfo | null> {
  const result = await db()
    .select()
    .from(l2ChainInfoTable)
    .where(
      and(
        eq(l2ChainInfoTable.l2NetworkId, l2NetworkId),
        eq(l2ChainInfoTable.rollupVersion, CURRENT_ROLLUP_VERSION_BIGINT),
      ),
    )
    .orderBy(desc(l2ChainInfoTable.updatedAt))
    .limit(1);

  if (result.length > 0) {
    const chainInfo = result[0] as (typeof result)[number] & {
      stakingAssetSymbol?: string | null;
      stakingAssetDecimals?: number | null;
    };

    return chicmozChainInfoSchema.parse({
      l2NetworkId: chainInfo.l2NetworkId,
      l1ChainId: chainInfo.l1ChainId,
      rollupVersion: chainInfo.rollupVersion,
      l1ContractAddresses: chainInfo.l1ContractAddresses,
      protocolContractAddresses: chainInfo.protocolContractAddresses,
      stakingAssetSymbol: chainInfo.stakingAssetSymbol ?? undefined,
      stakingAssetDecimals: chainInfo.stakingAssetDecimals ?? undefined,
    }) as ChicmozChainInfoWithStakingAsset;
  }

  if (result.length === 0 && NODE_ENV === NodeEnv.DEV) {
    const anyResult = await db()
      .select()
      .from(l2ChainInfoTable)
      .where(eq(l2ChainInfoTable.l2NetworkId, l2NetworkId))
      .orderBy(desc(l2ChainInfoTable.updatedAt))
      .limit(1);

    if (anyResult.length > 0) {
      const chainInfo = anyResult[0] as (typeof anyResult)[number] & {
        stakingAssetSymbol?: string | null;
        stakingAssetDecimals?: number | null;
      };

      return chicmozChainInfoSchema.parse({
        l2NetworkId: chainInfo.l2NetworkId,
        l1ChainId: chainInfo.l1ChainId,
        rollupVersion: chainInfo.rollupVersion,
        l1ContractAddresses: chainInfo.l1ContractAddresses,
        protocolContractAddresses: chainInfo.protocolContractAddresses,
        stakingAssetSymbol: chainInfo.stakingAssetSymbol ?? undefined,
        stakingAssetDecimals: chainInfo.stakingAssetDecimals ?? undefined,
      }) as ChicmozChainInfoWithStakingAsset;
    }
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function getLatestRollupVersion(): Promise<
  ChicmozChainInfo["rollupVersion"] | null
> {
  // Return the current rollup version instead of querying for the highest one
  // since version numbers don't necessarily increase with upgrades
  return CURRENT_ROLLUP_VERSION_BIGINT;
}
