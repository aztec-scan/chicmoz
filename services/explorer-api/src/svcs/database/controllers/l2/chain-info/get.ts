import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  type ChicmozChainInfo,
  type L2NetworkId,
  chicmozChainInfoSchema,
} from "@chicmoz-pkg/types";
import { desc, eq } from "drizzle-orm";
import { l2ChainInfoTable } from "../../../schema/l2/chain-info.js";
import { getCurrentRollupVersion } from "./rollup-version-cache.js";

type ChicmozChainInfoWithTokenMetadata = ChicmozChainInfo & {
  stakingAssetSymbol?: string;
  stakingAssetDecimals?: number;
  feeJuiceSymbol?: string;
  feeJuiceDecimals?: number;
};

export async function getL2ChainInfo(
  l2NetworkId: L2NetworkId,
): Promise<ChicmozChainInfo | null> {
  const result = await db()
    .select()
    .from(l2ChainInfoTable)
    .where(eq(l2ChainInfoTable.l2NetworkId, l2NetworkId))
    .orderBy(desc(l2ChainInfoTable.updatedAt))
    .limit(1);

  if (result.length > 0) {
    const currentRollupVersion = await getCurrentRollupVersion(l2NetworkId);
    const chainInfo = result[0] as (typeof result)[number] & {
      stakingAssetSymbol?: string | null;
      stakingAssetDecimals?: number | null;
      feeJuiceSymbol?: string | null;
      feeJuiceDecimals?: number | null;
    };

    return chicmozChainInfoSchema.parse({
      l2NetworkId: chainInfo.l2NetworkId,
      l1ChainId: chainInfo.l1ChainId,
      rollupVersion: currentRollupVersion ?? chainInfo.rollupVersion,
      l1ContractAddresses: chainInfo.l1ContractAddresses,
      protocolContractAddresses: chainInfo.protocolContractAddresses,
      stakingAssetSymbol: chainInfo.stakingAssetSymbol ?? undefined,
      stakingAssetDecimals: chainInfo.stakingAssetDecimals ?? undefined,
      feeJuiceSymbol: chainInfo.feeJuiceSymbol ?? undefined,
      feeJuiceDecimals: chainInfo.feeJuiceDecimals ?? undefined,
    }) as ChicmozChainInfoWithTokenMetadata;
  }

  return null;
}

export async function getLatestRollupVersion(): Promise<
  ChicmozChainInfo["rollupVersion"] | null
> {
  return getCurrentRollupVersion();
}
