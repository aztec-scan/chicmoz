import { ChicmozL1L2Validator } from "@chicmoz-pkg/types";
import { getTableColumns } from "drizzle-orm";
import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { l1L2ValidatorTable } from "../../../schema/l1/l2-validator.js";
import { getL1L2Validator } from "./get-single.js";

export async function getAllL1L2Validators(): Promise<
  ChicmozL1L2Validator[] | null
> {
  const res = await db()
    .select(getTableColumns(l1L2ValidatorTable))
    .from(l1L2ValidatorTable)
    .execute();
  if (!res.length) {return null;}
  const dbSingles = await Promise.all(
    res.map((validator) => getL1L2Validator(validator.attester))
  );
  return dbSingles.filter((v) => v !== null) as ChicmozL1L2Validator[];
}
