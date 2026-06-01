import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  type ChicmozL1FeeJuicePortalDeposit,
  chicmozL1FeeJuicePortalDepositSchema,
} from "@chicmoz-pkg/types";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { z } from "zod";
import { l1FeeJuicePortalDepositTable } from "../../../schema/l1/fee-juice-portal-deposit.js";

const LIMIT = 200;

/**
 * Get all fee juice deposits for a given L2 recipient address.
 * The `to` field is stored as a bytes32/Fr hex string.
 */
export async function getByL2Address(
  l2Address: string,
): Promise<ChicmozL1FeeJuicePortalDeposit[]> {
  const res = await db()
    .select(getTableColumns(l1FeeJuicePortalDepositTable))
    .from(l1FeeJuicePortalDepositTable)
    .where(eq(l1FeeJuicePortalDepositTable.to, l2Address))
    .orderBy(desc(l1FeeJuicePortalDepositTable.l1BlockNumber))
    .limit(LIMIT);
  return z.array(chicmozL1FeeJuicePortalDepositSchema).parse(res);
}

/**
 * Get all fee juice deposits (latest first), capped at LIMIT rows.
 */
export async function getAll(): Promise<ChicmozL1FeeJuicePortalDeposit[]> {
  const res = await db()
    .select(getTableColumns(l1FeeJuicePortalDepositTable))
    .from(l1FeeJuicePortalDepositTable)
    .orderBy(desc(l1FeeJuicePortalDepositTable.l1BlockNumber))
    .limit(LIMIT);
  return z.array(chicmozL1FeeJuicePortalDepositSchema).parse(res);
}
