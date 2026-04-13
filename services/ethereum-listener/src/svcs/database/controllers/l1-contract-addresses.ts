import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  L1ContractAddresses,
  L1ContractAddressesSchema,
} from "@chicmoz-pkg/types";
import { eq, getTableColumns } from "drizzle-orm";
import { L2_NETWORK_ID } from "../../../environment.js";
import { l1ContractAddressesTable } from "../schema.js";

export async function getL1Contracts() {
  const res = await db()
    .select(getTableColumns(l1ContractAddressesTable))
    .from(l1ContractAddressesTable)
    .where(eq(l1ContractAddressesTable.networkId, L2_NETWORK_ID))
    .limit(1);
  if (!res.length || !res[0].addresses)
    {throw new Error("L1 contracts not initialized");}
  return L1ContractAddressesSchema.parse(res[0].addresses);
}

export async function storeL1ContractAddresses(addresses: L1ContractAddresses) {
  await db()
    .insert(l1ContractAddressesTable)
    .values({
      addresses,
      networkId: L2_NETWORK_ID,
    })
    .onConflictDoUpdate({
      target: l1ContractAddressesTable.networkId,
      set: {
        addresses,
        lastUpdated: new Date(),
      },
    });
}
