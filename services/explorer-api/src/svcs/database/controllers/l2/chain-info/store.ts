import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { type ChicmozChainInfo } from "@chicmoz-pkg/types";
import { l2ChainInfoTable } from "../../../schema/l2/chain-info.js";
import { onRollupVersion } from "./rollup-version-cache.js";

type ChicmozChainInfoWithStakingAsset = ChicmozChainInfo & {
  stakingAssetSymbol?: string;
  stakingAssetDecimals?: number;
};

export async function storeChainInfo(
  chainInfo: ChicmozChainInfo,
): Promise<void> {
  const chainInfoWithStakingAsset =
    chainInfo as ChicmozChainInfoWithStakingAsset;
  const {
    l2NetworkId,
    l1ChainId,
    rollupVersion,
    l1ContractAddresses,
    protocolContractAddresses,
  } = chainInfo;

  const baseValues = {
    l2NetworkId,
    l1ChainId,
    rollupVersion,
    l1ContractAddresses,
    protocolContractAddresses,
  };

  const optionalValues = {
    ...(chainInfoWithStakingAsset.stakingAssetSymbol !== undefined
      ? { stakingAssetSymbol: chainInfoWithStakingAsset.stakingAssetSymbol }
      : {}),
    ...(chainInfoWithStakingAsset.stakingAssetDecimals !== undefined
      ? { stakingAssetDecimals: chainInfoWithStakingAsset.stakingAssetDecimals }
      : {}),
  };

  onRollupVersion(rollupVersion);

  await db()
    .insert(l2ChainInfoTable)
    .values({
      ...baseValues,
      ...optionalValues,
    })
    .onConflictDoUpdate({
      target: l2ChainInfoTable.l2NetworkId,
      set: {
        ...baseValues,
        ...optionalValues,
        updatedAt: new Date(),
      },
    });
}
