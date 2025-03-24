import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2ContractInstanceDeluxe, HexString } from "@chicmoz-pkg/types";
import { and, desc, eq, getTableColumns } from "drizzle-orm";
import { logger } from "../../../../logger.js";
import {
  l2ContractClassRegistered,
  l2ContractInstanceAztecScanNotes,
  l2ContractInstanceDeployed,
  l2ContractInstanceDeployerMetadataTable,
  l2ContractInstanceVerifiedDeploymentArguments,
} from "../../schema/l2contract/index.js";
import { getContractClassRegisteredColumns, parseDeluxe } from "./utils.js";

export const getL2DeployedContractInstanceByAddress = async (
  address: HexString,
  includeArtifactJson?: boolean,
): Promise<ChicmozL2ContractInstanceDeluxe | null> => {
  const allAztecScanNotes = await db()
    .select()
    .from(l2ContractInstanceAztecScanNotes)
    .where(eq(l2ContractInstanceAztecScanNotes.address, address))
    .execute();
  logger.info(`getL2DeployedContractInstanceByAddress allAztecScanNotes: ${allAztecScanNotes.length}`);
  logger.info(`getL2DeployedContractInstanceByAddress allAztecScanNotes: ${JSON.stringify(allAztecScanNotes)}`);
  logger.info(
    `getL2DeployedContractInstanceByAddress this aztecScanNotes: ${JSON.stringify(
      allAztecScanNotes.find((note) => note.address === address),
    )}`,
  );
  const result = await db()
    .select({
      instance: getTableColumns(l2ContractInstanceDeployed),
      class: getContractClassRegisteredColumns(includeArtifactJson),
      verifiedDeploymentArguments: getTableColumns(
        l2ContractInstanceVerifiedDeploymentArguments,
      ),
      deployerMetadata: getTableColumns(
        l2ContractInstanceDeployerMetadataTable,
      ),
    })
    .from(l2ContractInstanceDeployed)
    .innerJoin(
      l2ContractClassRegistered,
      and(
        eq(
          l2ContractInstanceDeployed.contractClassId,
          l2ContractClassRegistered.contractClassId,
        ),
        eq(
          l2ContractInstanceDeployed.version,
          l2ContractClassRegistered.version,
        ),
      ),
    )
    .leftJoin(
      l2ContractInstanceVerifiedDeploymentArguments,
      and(
        eq(
          l2ContractInstanceDeployed.address,
          l2ContractInstanceVerifiedDeploymentArguments.address,
        ),
      ),
    )
    .leftJoin(
      l2ContractInstanceDeployerMetadataTable,
      eq(
        l2ContractInstanceDeployed.address,
        l2ContractInstanceDeployerMetadataTable.address,
      ),
    )
    .leftJoin(
      l2ContractInstanceAztecScanNotes,
      eq(
        l2ContractInstanceDeployed.address,
        l2ContractInstanceAztecScanNotes.address,
      ),
    )
    .where(eq(l2ContractInstanceDeployed.address, address))
    .orderBy(desc(l2ContractInstanceDeployed.version))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const {
    instance,
    class: contractClass,
    verifiedDeploymentArguments,
    deployerMetadata,
  } = result[0];

  return parseDeluxe({
    contractClass,
    instance,
    verifiedDeploymentArguments,
    deployerMetadata,
  });
};
