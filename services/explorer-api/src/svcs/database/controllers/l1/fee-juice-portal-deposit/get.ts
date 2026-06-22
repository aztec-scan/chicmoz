import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  type ChicmozL1FeeJuicePortalDeposit,
  chicmozL1FeeJuicePortalDepositSchema,
} from "@chicmoz-pkg/types";
import { and, desc, eq, getTableColumns } from "drizzle-orm";
import { z } from "zod";
import { L2_NETWORK_ID } from "../../../../../environment.js";
import { l1FeeJuicePortalDepositTable } from "../../../schema/l1/fee-juice-portal-deposit.js";
import { getL2ChainInfo } from "../../l2/index.js";

const LIMIT = 200;

async function getCurrentFeeJuicePortalAddress(): Promise<string | null> {
  const chainInfo = await getL2ChainInfo(L2_NETWORK_ID);
  return chainInfo?.l1ContractAddresses.feeJuicePortalAddress.toLowerCase() ?? null;
}

/**
 * Get all fee juice deposits for a given L2 recipient address.
 * The `to` field is stored as a bytes32/Fr hex string.
 */
export async function getByL2Address(
  l2Address: string,
): Promise<ChicmozL1FeeJuicePortalDeposit[]> {
  const currentFeeJuicePortalAddress = await getCurrentFeeJuicePortalAddress();
  const finalizedFilter = eq(l1FeeJuicePortalDepositTable.isFinalized, true);
  const l2AddressFilter = eq(l1FeeJuicePortalDepositTable.to, l2Address);
  const currentPortalFilter = currentFeeJuicePortalAddress
    ? eq(
        l1FeeJuicePortalDepositTable.l1ContractAddress,
        currentFeeJuicePortalAddress,
      )
    : undefined;

  const res = await db()
    .select(getTableColumns(l1FeeJuicePortalDepositTable))
    .from(l1FeeJuicePortalDepositTable)
    .where(
      currentPortalFilter
        ? and(l2AddressFilter, finalizedFilter, currentPortalFilter)
        : and(l2AddressFilter, finalizedFilter),
    )
    .orderBy(desc(l1FeeJuicePortalDepositTable.l1BlockNumber))
    .limit(LIMIT);
  return z.array(chicmozL1FeeJuicePortalDepositSchema).parse(res);
}

/**
 * Get all fee juice deposits (latest first), capped at LIMIT rows.
 */
export async function getAll(): Promise<ChicmozL1FeeJuicePortalDeposit[]> {
  const currentFeeJuicePortalAddress = await getCurrentFeeJuicePortalAddress();
  const finalizedFilter = eq(l1FeeJuicePortalDepositTable.isFinalized, true);
  const currentPortalFilter = currentFeeJuicePortalAddress
    ? eq(
        l1FeeJuicePortalDepositTable.l1ContractAddress,
        currentFeeJuicePortalAddress,
      )
    : undefined;

  const res = await db()
    .select(getTableColumns(l1FeeJuicePortalDepositTable))
    .from(l1FeeJuicePortalDepositTable)
    .where(
      currentPortalFilter
        ? and(finalizedFilter, currentPortalFilter)
        : finalizedFilter,
    )
    .orderBy(desc(l1FeeJuicePortalDepositTable.l1BlockNumber))
    .limit(LIMIT);
  return z.array(chicmozL1FeeJuicePortalDepositSchema).parse(res);
}
