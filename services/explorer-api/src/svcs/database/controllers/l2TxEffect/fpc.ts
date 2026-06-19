import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { and, eq, ne } from "drizzle-orm";
import { txEffect } from "../../../database/schema/l2block/index.js";

/**
 * Find distinct Fee Paying Contract (FPC) addresses that have paid fees for
 * transactions initiated by the given address.
 * An FPC is identified by feePayer !== initiator and feePaymentMethod === "fpc".
 */
export const getFeePayersForAddress = async (
  address: string,
): Promise<string[]> => {
  const result = await db()
    .selectDistinct({ feePayer: txEffect.feePayer })
    .from(txEffect)
    .where(
      and(
        eq(txEffect.initiator, address),
        ne(txEffect.feePayer, address),
        eq(txEffect.feePaymentMethod, "fpc"),
      ),
    );

  return result
    .map((row) => row.feePayer)
    .filter((addr): addr is string => addr !== null);
};

/**
 * Find distinct addresses that the given FPC has sponsored (paid fees for).
 * An FPC is identified by feePayer !== initiator and feePaymentMethod === "fpc".
 */
export const getSponsoredAddressesForFpc = async (
  fpcAddress: string,
): Promise<string[]> => {
  const result = await db()
    .selectDistinct({ initiator: txEffect.initiator })
    .from(txEffect)
    .where(
      and(
        eq(txEffect.feePayer, fpcAddress),
        ne(txEffect.initiator, fpcAddress),
        eq(txEffect.feePaymentMethod, "fpc"),
      ),
    );

  return result
    .map((row) => row.initiator)
    .filter((addr): addr is string => addr !== null);
};
