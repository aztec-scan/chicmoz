import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozChainInfo } from "@chicmoz-pkg/types";
import { l2ChainInfoTable } from "../../../schema/l2/chain-info.js";

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
