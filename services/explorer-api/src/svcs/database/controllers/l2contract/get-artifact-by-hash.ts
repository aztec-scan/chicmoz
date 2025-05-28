import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { HexString } from "@chicmoz-pkg/types";
import { eq } from "drizzle-orm";
import { l2ContractClassRegistered } from "../../schema/l2contract/index.js";

export const getArtifactByHash = async (
  artifactHash: HexString,
): Promise<object | null> => {
  const result = await db()
    .select({
      artifactJson: l2ContractClassRegistered.artifactJson,
    })
    .from(l2ContractClassRegistered)
    .where(eq(l2ContractClassRegistered.artifactHash, artifactHash))
    .limit(1);

  if (result.length === 0 || !result[0].artifactJson) {
    return null;
  }

  return JSON.parse(result[0].artifactJson) as object;
};
