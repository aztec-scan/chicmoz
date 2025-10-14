import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozChainInfo,
  L2NetworkId,
  chicmozChainInfoSchema,
  CURRENT_ROLLUP_VERSION,
} from "@chicmoz-pkg/types";
import { and, desc, eq } from "drizzle-orm";
import { l2Schemas } from "@chicmoz-pkg/database-registry";
const { l2ChainInfoTable } = l2Schemas;

export async function getL2ChainInfo(
  l2NetworkId: L2NetworkId,
): Promise<ChicmozChainInfo | null> {
  const result = await db()
    .select()
    .from(l2ChainInfoTable)
    .where(
      and(
        eq(l2ChainInfoTable.l2NetworkId, l2NetworkId),
        eq(l2ChainInfoTable.rollupVersion, BigInt(CURRENT_ROLLUP_VERSION)),
      ),
    )
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

// eslint-disable-next-line @typescript-eslint/require-await
export async function getLatestRollupVersion(): Promise<
  ChicmozChainInfo["rollupVersion"] | null
> {
  // Return the current rollup version instead of querying for the highest one
  // since version numbers don't necessarily increase with upgrades
  return BigInt(CURRENT_ROLLUP_VERSION);
}
