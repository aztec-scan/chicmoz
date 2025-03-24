import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  AztecScanNote,
  NODE_ENV,
  NodeEnv,
  chicmozL2ContractInstanceDeployerMetadataSchema,
  type ChicmozL2ContractInstanceDeployerMetadata,
} from "@chicmoz-pkg/types";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { logger } from "../../../../logger.js";
import {
  l2ContractInstanceAztecScanNotes,
  l2ContractInstanceDeployerMetadataTable,
} from "../../../database/schema/l2contract/index.js";

export const updateContractInstanceDeployerMetadata = async (
  contractDeployerMetadata: Omit<
    ChicmozL2ContractInstanceDeployerMetadata,
    "uploadedAt"
  >,
): Promise<ChicmozL2ContractInstanceDeployerMetadata | undefined> => {
  if (NODE_ENV === NodeEnv.PROD) {
    if (contractDeployerMetadata.reviewedAt) {
      throw new Error("ContractDeployerMetadata.reviewedAt should not be set");
    }
  } else {
    logger.warn(
      `manually setting reviewedAt for non-prod environment contract address: ${contractDeployerMetadata.address}`,
    );
  }
  const res = await db().transaction(async (dbTx) => {
    const unReviewdMetadata = await dbTx
      .select({
        latestMetadataId: l2ContractInstanceDeployerMetadataTable.id,
      })
      .from(l2ContractInstanceDeployerMetadataTable)
      .where(
        and(
          eq(
            l2ContractInstanceDeployerMetadataTable.address,
            contractDeployerMetadata.address,
          ),
          isNull(l2ContractInstanceDeployerMetadataTable.reviewedAt),
        ),
      )
      .limit(1);
    if (unReviewdMetadata.length > 0) {
      return await dbTx
        .update(l2ContractInstanceDeployerMetadataTable)
        .set({
          ...contractDeployerMetadata,
          uploadedAt: new Date(),
        })
        .where(
          eq(
            l2ContractInstanceDeployerMetadataTable.id,
            unReviewdMetadata[0].latestMetadataId,
          ),
        )
        .returning();
    } else {
      return await dbTx
        .insert(l2ContractInstanceDeployerMetadataTable)
        .values({
          address: contractDeployerMetadata.address,
          contractIdentifier: contractDeployerMetadata.contractIdentifier,
          details: contractDeployerMetadata.details,
          creatorName: contractDeployerMetadata.creatorName,
          creatorContact: contractDeployerMetadata.creatorContact,
          appUrl: contractDeployerMetadata.appUrl,
          repoUrl: contractDeployerMetadata.repoUrl,
        })
        .returning();
    }
  });
  return z
    .array(chicmozL2ContractInstanceDeployerMetadataSchema)
    .parse(res)
    .at(0);
};

/**
 * Store origin notes for a contract instance
 * @param address Contract address
 * @param comment Note about the contract's origin/trust status
 * @returns The stored origin note record
 */
export const storeContractInstanceAztecScanNotes = async ({
  address,
  aztecScanNotes,
}: {
  address: string;
  aztecScanNotes: AztecScanNote;
}): Promise<
  { id: string; address: string; comment: string; uploadedAt: Date } | undefined
> => {
  // In production mode, skip this operation for now
  if (NODE_ENV === NodeEnv.PROD) {
    logger.warn(`Skipping origin notes in production for address: ${address}`);
    return undefined;
  }

  logger.info(`Storing origin notes for contract: ${address}`);

  const res = await db().transaction(async (dbTx) => {
    // Check if there are existing notes
    const existingNotes = await dbTx
      .select()
      .from(l2ContractInstanceAztecScanNotes)
      .where(eq(l2ContractInstanceAztecScanNotes.address, address))
      .limit(1);

    if (existingNotes.length > 0) {
      // Update existing notes
      return await dbTx
        .update(l2ContractInstanceAztecScanNotes)
        .set({
          ...aztecScanNotes,
          uploadedAt: new Date(),
        })
        .where(eq(l2ContractInstanceAztecScanNotes.id, existingNotes[0].id))
        .returning();
    } else {
      // Insert new notes
      return await dbTx
        .insert(l2ContractInstanceAztecScanNotes)
        .values({
          ...aztecScanNotes,
          address,
          uploadedAt: new Date(),
        })
        .returning();
    }
  });

  return res[0];
};
