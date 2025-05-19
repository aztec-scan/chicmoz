import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL1L2Validator } from "@chicmoz-pkg/types";
import { eq, getTableColumns } from "drizzle-orm";
import { L2_NETWORK_ID } from "../../../../../environment.js";
import { logger } from "../../../../../logger.js";
import { l1L2ValidatorTable } from "../../../schema/l1/l2-validator.js";
import { getL2ChainInfo } from "../../l2/index.js";
import { getL1L2Validator } from "./get-single.js";

export async function getAllL1L2Validators(
  status?: ChicmozL1L2Validator["status"],
): Promise<ChicmozL1L2Validator[] | null> {
  const chainInfo = await getL2ChainInfo(L2_NETWORK_ID);

  if (!chainInfo) {
    logger.error("Chain info not found");
    return null;
  }
  return db().transaction(async (dbTx) => {
    const res = await dbTx
      .select(getTableColumns(l1L2ValidatorTable))
      .from(l1L2ValidatorTable)
      .where(
        eq(
          l1L2ValidatorTable.rollupAddress,
          chainInfo?.l1ContractAddresses.rollupAddress,
        ),
      )
      .execute();
    if (!res.length) {
      return null;
    }
    const dbSingles = await Promise.all(
      res.map((validator) =>
        getL1L2Validator(
          validator.attester,
          chainInfo.l1ContractAddresses.rollupAddress,
        ),
      ),
    );
    return dbSingles.filter(
      (v) => v !== null && (status ? v.status === status : true),
    ) as ChicmozL1L2Validator[];
  });
}
