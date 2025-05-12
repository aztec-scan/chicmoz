import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozChainInfo,
  L2NetworkId,
  chicmozChainInfoSchema,
} from "@chicmoz-pkg/types";
import { desc, eq } from "drizzle-orm";
import { l2ChainInfoTable } from "../../../schema/l2/chain-info.js";

export async function getL2ChainInfo(
  l2NetworkId: L2NetworkId,
): Promise<ChicmozChainInfo | null> {
  const result = await db()
    .select()
    .from(l2ChainInfoTable)
    .where(eq(l2ChainInfoTable.l2NetworkId, l2NetworkId))
    .orderBy(desc(l2ChainInfoTable.updatedAt))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const chainInfo = result[0];

  return chicmozChainInfoSchema.parse({
    l2NetworkId: chainInfo.l2NetworkId,
    l1ChainId: chainInfo.l1ChainId,
    rollupVersion: chainInfo.rollupVersion,
    l1ContractAddresses: chainInfo.l1ContractAddresses,
    protocolContractAddresses: chainInfo.protocolContractAddresses,
  });
}
