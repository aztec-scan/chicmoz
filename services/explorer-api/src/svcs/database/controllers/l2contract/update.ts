import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  NODE_ENV,
  NodeEnv,
  type ChicmozL2ContractInstanceDeployerMetadata,
} from "@chicmoz-pkg/types";
import { and, eq, isNull } from "drizzle-orm";
import { logger } from "../../../../logger.js";
import { l2ContractInstanceDeployerMetadataTable } from "../../../database/schema/l2contract/index.js";

export const updateContractInstanceDeployerMetadata = async (
  contractDeployerMetadata: ChicmozL2ContractInstanceDeployerMetadata,
): Promise<void> => {
  if (contractDeployerMetadata.uploadedAt) {
    throw new Error("ContractDeployerMetadata.uploadedAt should not be set");
  }
  if (NODE_ENV === NodeEnv.PROD) {
    if (contractDeployerMetadata.reviewedAt) {
      throw new Error("ContractDeployerMetadata.reviewedAt should not be set");
    }
  } else {
    logger.warn(
      `manually setting reviewedAt for non-prod environment contract address: ${contractDeployerMetadata.address}`,
    );
  }
  await db().transaction(async (dbTx) => {
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
      await dbTx
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
        );
    } else {
      await dbTx.insert(l2ContractInstanceDeployerMetadataTable).values({
        address: contractDeployerMetadata.address,
        contractIdentifier: contractDeployerMetadata.contractIdentifier,
        details: contractDeployerMetadata.details,
        creatorName: contractDeployerMetadata.creatorName,
        creatorContact: contractDeployerMetadata.creatorContact,
        appUrl: contractDeployerMetadata.appUrl,
        repoUrl: contractDeployerMetadata.repoUrl,
      });
    }
  });
};
