import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { l2Schemas } from "@chicmoz-pkg/database-registry";
import { ChicmozChainInfo } from "@chicmoz-pkg/types";
import { onRollupVersion } from "./rollup-version-cache.js";

const {
  l2ChainInfoTable,
} = l2Schemas

export async function storeChainInfo(
  chainInfo: ChicmozChainInfo,
): Promise<void> {
  const {
    l2NetworkId,
    l1ChainId,
    rollupVersion,
    l1ContractAddresses,
    protocolContractAddresses,
  } = chainInfo;

  onRollupVersion(rollupVersion);

  await db()
    .insert(l2ChainInfoTable)
    .values({
      l2NetworkId,
      l1ChainId,
      rollupVersion,
      l1ContractAddresses,
      protocolContractAddresses,
    })
    .onConflictDoUpdate({
      target: l2ChainInfoTable.l2NetworkId,
      set: {
        l1ChainId,
        rollupVersion,
        l1ContractAddresses,
        protocolContractAddresses,
        updatedAt: new Date(),
      },
    });
}
