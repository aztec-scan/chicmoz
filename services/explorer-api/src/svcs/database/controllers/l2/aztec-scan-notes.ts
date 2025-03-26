import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { AztecScanNote, aztecScanNoteSchema } from "@chicmoz-pkg/types";
import { eq } from "drizzle-orm";
import { logger } from "../../../../logger.js";
import { l2ContractInstanceAztecScanNotes } from "../../../database/schema/l2contract/index.js";

export const updateContractInstanceAztecScanNotes = async ({
  contractInstanceAddress,
  aztecScanNotes,
}: {
  contractInstanceAddress: string;
  aztecScanNotes: AztecScanNote | undefined | null;
}): Promise<AztecScanNote | undefined> => {
  if (!aztecScanNotes) {
    logger.warn(`No notes provided for contract: ${contractInstanceAddress}`);
    return undefined;
  }
  const res = await db().transaction(async (dbTx) => {
    const existingNotes = await dbTx
      .select()
      .from(l2ContractInstanceAztecScanNotes)
      .where(
        eq(l2ContractInstanceAztecScanNotes.address, contractInstanceAddress),
      )
      .limit(1);
    if (existingNotes.length > 0) {
      return await dbTx
        .update(l2ContractInstanceAztecScanNotes)
        .set({
          ...aztecScanNotes,
        })
        .where(eq(l2ContractInstanceAztecScanNotes.id, existingNotes[0].id))
        .returning();
    } else {
      return await dbTx
        .insert(l2ContractInstanceAztecScanNotes)
        .values({
          ...aztecScanNotes,
          address: contractInstanceAddress,
        })
        .returning();
    }
  });
  return aztecScanNoteSchema.parse(res[0]);
};
