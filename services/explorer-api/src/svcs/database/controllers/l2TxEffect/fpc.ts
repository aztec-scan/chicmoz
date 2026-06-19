import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { and, eq, ne, isNotNull } from "drizzle-orm";
import { txEffect } from "../../../database/schema/l2block/index.js";
import { l2TxPublicCallRequest } from "../../../database/schema/l2public-call/index.js";

/**
 * Find distinct Fee Paying Contract (FPC) addresses that have paid fees for
 * transactions where the given address was involved — either as the initiator
 * or as a msgSender in public call requests.
 *
 * An FPC is identified by feePayer !== address (someone else paid the fee).
 */
export const getFeePayersForAddress = async (
  address: string,
): Promise<string[]> => {
  // Check as initiator: tx_effect where initiator = address, feePayer != address.
  const initiatorResult = await db()
    .selectDistinct({ feePayer: txEffect.feePayer })
    .from(txEffect)
    .where(
      and(
        eq(txEffect.initiator, address),
        ne(txEffect.feePayer, address),
        isNotNull(txEffect.feePayer),
      ),
    );

  // Check as msgSender: join tx_public_call_request → tx_effect.
  const msgSenderResult = await db()
    .selectDistinct({ feePayer: txEffect.feePayer })
    .from(l2TxPublicCallRequest)
    .innerJoin(txEffect, eq(l2TxPublicCallRequest.txHash, txEffect.txHash))
    .where(
      and(
        eq(l2TxPublicCallRequest.msgSender, address),
        ne(txEffect.feePayer, address),
        isNotNull(txEffect.feePayer),
      ),
    );

  const all = [...initiatorResult, ...msgSenderResult];
  const seen = new Set<string>();
  return all
    .map((row) => row.feePayer)
    .filter((addr): addr is string => {
      if (addr === null || seen.has(addr)) {return false;}
      seen.add(addr);
      return true;
    });
};

/**
 * Find distinct addresses that the given FPC has sponsored (paid fees for).
 * Checks both initiator and msgSender roles.
 */
export const getSponsoredAddressesForFpc = async (
  fpcAddress: string,
): Promise<string[]> => {
  // Check as initiator: tx_effect where feePayer = fpcAddress, initiator != fpcAddress.
  const initiatorResult = await db()
    .selectDistinct({ address: txEffect.initiator })
    .from(txEffect)
    .where(
      and(
        eq(txEffect.feePayer, fpcAddress),
        ne(txEffect.initiator, fpcAddress),
        isNotNull(txEffect.initiator),
      ),
    );

  // Check as msgSender: join tx_public_call_request → tx_effect.
  const msgSenderResult = await db()
    .selectDistinct({ address: l2TxPublicCallRequest.msgSender })
    .from(l2TxPublicCallRequest)
    .innerJoin(txEffect, eq(l2TxPublicCallRequest.txHash, txEffect.txHash))
    .where(
      and(
        eq(txEffect.feePayer, fpcAddress),
        ne(l2TxPublicCallRequest.msgSender, fpcAddress),
        isNotNull(l2TxPublicCallRequest.msgSender),
      ),
    );

  const all = [...initiatorResult, ...msgSenderResult];
  const seen = new Set<string>();
  return all
    .map((row) => row.address)
    .filter((addr): addr is string => {
      if (addr === null || seen.has(addr)) {return false;}
      seen.add(addr);
      return true;
    });
};
