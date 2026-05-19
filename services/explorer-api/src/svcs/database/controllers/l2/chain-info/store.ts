import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { type ChicmozChainInfo } from "@chicmoz-pkg/types";
import { l2ChainInfoTable } from "../../../schema/l2/chain-info.js";
import {
  getCurrentRollupVersion,
  observeRollupVersion,
} from "./rollup-version-cache.js";

type ChicmozChainInfoWithTokenMetadata = ChicmozChainInfo & {
  stakingAssetSymbol?: string;
  stakingAssetDecimals?: number;
  feeJuiceSymbol?: string;
  feeJuiceDecimals?: number;
};

export async function storeChainInfo(
  chainInfo: ChicmozChainInfo,
): Promise<void> {
  const chainInfoWithTokenMetadata =
    chainInfo as ChicmozChainInfoWithTokenMetadata;
  const {
    l2NetworkId,
    l1ChainId,
    rollupVersion,
    l1ContractAddresses,
    protocolContractAddresses,
  } = chainInfo;
  const normalizedRollupVersion = BigInt(rollupVersion);

  const baseValues = {
    l2NetworkId,
    l1ChainId,
    rollupVersion: normalizedRollupVersion,
    l1ContractAddresses,
    protocolContractAddresses,
  };

  const optionalValues = {
    ...(chainInfoWithTokenMetadata.stakingAssetSymbol !== undefined
      ? { stakingAssetSymbol: chainInfoWithTokenMetadata.stakingAssetSymbol }
      : {}),
    ...(chainInfoWithTokenMetadata.stakingAssetDecimals !== undefined
      ? {
          stakingAssetDecimals: chainInfoWithTokenMetadata.stakingAssetDecimals,
        }
      : {}),
    ...(chainInfoWithTokenMetadata.feeJuiceSymbol !== undefined
      ? { feeJuiceSymbol: chainInfoWithTokenMetadata.feeJuiceSymbol }
      : {}),
    ...(chainInfoWithTokenMetadata.feeJuiceDecimals !== undefined
      ? { feeJuiceDecimals: chainInfoWithTokenMetadata.feeJuiceDecimals }
      : {}),
  };

  await observeRollupVersion({
    l2NetworkId,
    rollupVersion: normalizedRollupVersion,
    source: "chain-info",
  });

  const currentRollupVersion = await getCurrentRollupVersion(l2NetworkId);
  if (currentRollupVersion !== normalizedRollupVersion) {
    return;
  }

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
