import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozChainInfo,
  ChicmozL1L2Validator,
  EthAddress,
  chicmozL1L2ValidatorSchema,
} from "@chicmoz-pkg/types";
import { and, desc, eq, getTableColumns } from "drizzle-orm";
import { L2_NETWORK_ID } from "../../../../../environment.js";
import { logger } from "../../../../../logger.js";
import {
  l1L2ValidatorProposerTable,
  l1L2ValidatorStakeTable,
  l1L2ValidatorStatusTable,
  l1L2ValidatorTable,
  l1L2ValidatorWithdrawerTable,
} from "../../../schema/l1/l2-validator.js";
import { getL2ChainInfo } from "../../l2/index.js";

export async function getL1L2Validator(
  attesterAddress: EthAddress,
  rollupAddress?: EthAddress,
): Promise<ChicmozL1L2Validator | null> {
  let chainInfo: ChicmozChainInfo | null = null;
  if (!rollupAddress) {
    chainInfo = await getL2ChainInfo(L2_NETWORK_ID);
    if (chainInfo === null) {
      logger.error("Chain info not found");
      return null;
    }
  }
  const res = await db().transaction(async (tx) => {
    const validator = await tx
      .select(getTableColumns(l1L2ValidatorTable))
      .from(l1L2ValidatorTable)
      .where(
        and(
          eq(l1L2ValidatorTable.attester, attesterAddress),
          eq(
            l1L2ValidatorTable.rollupAddress,
            rollupAddress ?? chainInfo!.l1ContractAddresses.rollupAddress,
          ),
        ),
      )
      .limit(1);
    const stake = await tx
      .select(getTableColumns(l1L2ValidatorStakeTable))
      .from(l1L2ValidatorStakeTable)
      .where(eq(l1L2ValidatorStakeTable.attesterAddress, attesterAddress))
      .orderBy(desc(l1L2ValidatorStakeTable.timestamp))
      .limit(1);
    const status = await tx
      .select(getTableColumns(l1L2ValidatorStatusTable))
      .from(l1L2ValidatorStatusTable)
      .where(eq(l1L2ValidatorStatusTable.attesterAddress, attesterAddress))
      .orderBy(desc(l1L2ValidatorStatusTable.timestamp))
      .limit(1);
    const withdrawer = await tx
      .select(getTableColumns(l1L2ValidatorWithdrawerTable))
      .from(l1L2ValidatorWithdrawerTable)
      .where(eq(l1L2ValidatorWithdrawerTable.attesterAddress, attesterAddress))
      .orderBy(desc(l1L2ValidatorWithdrawerTable.timestamp))
      .limit(1);
    const proposer = await tx
      .select(getTableColumns(l1L2ValidatorProposerTable))
      .from(l1L2ValidatorProposerTable)
      .where(eq(l1L2ValidatorProposerTable.attesterAddress, attesterAddress))
      .orderBy(desc(l1L2ValidatorProposerTable.timestamp))
      .limit(1);
    return {
      attester: validator[0]?.attester,
      rollupAddress: validator[0]?.rollupAddress,
      firstSeenAt: validator[0]?.firstSeenAt,
      stake: stake[0]?.stake ? BigInt(stake[0].stake) : BigInt(0),
      status: status[0]?.status,
      withdrawer: withdrawer[0]?.withdrawer,
      proposer: proposer[0]?.proposer,
      latestSeenChangeAt: new Date(
        Math.max(
          stake[0]?.timestamp.getTime(),
          status[0]?.timestamp.getTime(),
          withdrawer[0]?.timestamp.getTime(),
          proposer[0]?.timestamp.getTime(),
        ),
      ),
    };
  });
  if (!res.attester) {
    return null;
  }
  return chicmozL1L2ValidatorSchema.parse(res);
}
