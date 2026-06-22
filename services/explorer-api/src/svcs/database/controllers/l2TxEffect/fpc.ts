import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { and, eq, ne, isNotNull, desc } from "drizzle-orm";
import { txEffect, body, l2Block } from "../../../database/schema/l2block/index.js";
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

export type FpcTransactionEntry = {
  txHash: string;
  feePayer: string;
  sponsoredAddress: string;
  transactionFee: string;
  blockHeight: bigint;
  timestamp: number;
};

const FPC_TX_LIMIT = 50;

/**
 * Get transactions where this address paid fees for others (asFeePayer)
 * or where others paid fees for this address (asSponsored).
 * Checks both initiator and msgSender roles.
 */
export const getFpcTransactions = async (
  address: string,
): Promise<{ asFeePayer: FpcTransactionEntry[]; asSponsored: FpcTransactionEntry[] }> => {
  // asFeePayer: feePayer = address, someone else is the beneficiary
  const feePayerInitiatorRows = await db()
    .select({
      txHash: txEffect.txHash,
      feePayer: txEffect.feePayer,
      sponsoredAddress: txEffect.initiator,
      transactionFee: txEffect.transactionFee,
      blockHeight: l2Block.height,
      timestamp: txEffect.txBirthTimestamp,
    })
    .from(txEffect)
    .innerJoin(body, eq(txEffect.bodyId, body.id))
    .innerJoin(l2Block, eq(body.blockHash, l2Block.hash))
    .where(
      and(
        eq(txEffect.feePayer, address),
        ne(txEffect.initiator, address),
        isNotNull(txEffect.initiator),
        isNotNull(txEffect.feePayer),
      ),
    )
    .orderBy(desc(txEffect.txBirthTimestamp))
    .limit(FPC_TX_LIMIT);

  const feePayerMsgSenderRows = await db()
    .select({
      txHash: txEffect.txHash,
      feePayer: txEffect.feePayer,
      sponsoredAddress: l2TxPublicCallRequest.msgSender,
      transactionFee: txEffect.transactionFee,
      blockHeight: l2Block.height,
      timestamp: txEffect.txBirthTimestamp,
    })
    .from(l2TxPublicCallRequest)
    .innerJoin(txEffect, eq(l2TxPublicCallRequest.txHash, txEffect.txHash))
    .innerJoin(body, eq(txEffect.bodyId, body.id))
    .innerJoin(l2Block, eq(body.blockHash, l2Block.hash))
    .where(
      and(
        eq(txEffect.feePayer, address),
        ne(l2TxPublicCallRequest.msgSender, address),
        isNotNull(l2TxPublicCallRequest.msgSender),
        isNotNull(txEffect.feePayer),
      ),
    )
    .orderBy(desc(txEffect.txBirthTimestamp))
    .limit(FPC_TX_LIMIT);

  // asSponsored: initiator or msgSender = address, someone else paid
  const sponsoredInitiatorRows = await db()
    .select({
      txHash: txEffect.txHash,
      feePayer: txEffect.feePayer,
      sponsoredAddress: txEffect.initiator,
      transactionFee: txEffect.transactionFee,
      blockHeight: l2Block.height,
      timestamp: txEffect.txBirthTimestamp,
    })
    .from(txEffect)
    .innerJoin(body, eq(txEffect.bodyId, body.id))
    .innerJoin(l2Block, eq(body.blockHash, l2Block.hash))
    .where(
      and(
        eq(txEffect.initiator, address),
        ne(txEffect.feePayer, address),
        isNotNull(txEffect.feePayer),
      ),
    )
    .orderBy(desc(txEffect.txBirthTimestamp))
    .limit(FPC_TX_LIMIT);

  const sponsoredMsgSenderRows = await db()
    .select({
      txHash: txEffect.txHash,
      feePayer: txEffect.feePayer,
      sponsoredAddress: l2TxPublicCallRequest.msgSender,
      transactionFee: txEffect.transactionFee,
      blockHeight: l2Block.height,
      timestamp: txEffect.txBirthTimestamp,
    })
    .from(l2TxPublicCallRequest)
    .innerJoin(txEffect, eq(l2TxPublicCallRequest.txHash, txEffect.txHash))
    .innerJoin(body, eq(txEffect.bodyId, body.id))
    .innerJoin(l2Block, eq(body.blockHash, l2Block.hash))
    .where(
      and(
        eq(l2TxPublicCallRequest.msgSender, address),
        ne(txEffect.feePayer, address),
        isNotNull(txEffect.feePayer),
      ),
    )
    .orderBy(desc(txEffect.txBirthTimestamp))
    .limit(FPC_TX_LIMIT);

  const dedup = (rows: typeof feePayerInitiatorRows): FpcTransactionEntry[] => {
    const seen = new Set<string>();
    return rows
      .filter((r): r is typeof r & { feePayer: string; sponsoredAddress: string } =>
        r.feePayer !== null && r.sponsoredAddress !== null,
      )
      .filter((r) => {
        const key = `${r.txHash}:${r.sponsoredAddress}`;
        if (seen.has(key)) {return false;}
        seen.add(key);
        return true;
      })
      .map((r) => ({
        txHash: r.txHash,
        feePayer: r.feePayer,
        sponsoredAddress: r.sponsoredAddress,
        transactionFee: r.transactionFee,
        blockHeight: r.blockHeight,
        timestamp: r.timestamp,
      }));
  };

  return {
    asFeePayer: dedup([...feePayerInitiatorRows, ...feePayerMsgSenderRows])
      .slice(0, FPC_TX_LIMIT),
    asSponsored: dedup([...sponsoredInitiatorRows, ...sponsoredMsgSenderRows])
      .slice(0, FPC_TX_LIMIT),
  };
};
