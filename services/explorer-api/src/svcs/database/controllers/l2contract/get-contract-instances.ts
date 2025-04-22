import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2ContractInstanceDeluxe, HexString } from "@chicmoz-pkg/types";
import { and, desc, eq, getTableColumns, isNotNull } from "drizzle-orm";
import { DB_MAX_CONTRACTS } from "../../../../environment.js";
import { l2Block } from "../../schema/index.js";
import {
  l2ContractClassRegistered,
  l2ContractInstanceDeployed,
  l2ContractInstanceDeployerMetadataTable,
  l2ContractInstanceVerifiedDeploymentArguments,
} from "../../schema/l2contract/index.js";
import { getBlocksWhereRange } from "../utils.js";
import { getContractClassRegisteredColumns, parseDeluxe } from "./utils.js";

const DEFAULT_SORT =
  (desc(l2ContractInstanceDeployed.version), desc(l2Block.height));

export const getL2DeployedContractInstances = async ({
  fromHeight,
  toHeight,
  includeArtifactJson,
}: {
  fromHeight?: bigint;
  toHeight?: bigint;
  includeArtifactJson?: boolean;
}): Promise<ChicmozL2ContractInstanceDeluxe[]> => {
  const whereRange = getBlocksWhereRange({ from: fromHeight, to: toHeight });
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
      isOrphaned: isNotNull(l2Block.orphan_timestamp),
    })
    .from(l2ContractInstanceDeployed)
    .leftJoin(
      l2ContractClassRegistered,
      and(
        eq(
          l2ContractInstanceDeployed.currentContractClassId,
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
      and(
        eq(
          l2ContractInstanceDeployed.address,
          l2ContractInstanceDeployerMetadataTable.address,
        ),
      ),
    )
    .innerJoin(l2Block, eq(l2Block.hash, l2ContractInstanceDeployed.blockHash))
    .where(whereRange)
    .orderBy(DEFAULT_SORT)
    .limit(DB_MAX_CONTRACTS);

  const parsed = result.map((r) => {
    return parseDeluxe({
      contractClass: r.class,
      instance: r.instance,
      verifiedDeploymentArguments: r.verifiedDeploymentArguments,
      deployerMetadata: r.deployerMetadata,
      aztecScanNotes: null,
      isOrphaned: Boolean(r.isOrphaned),
    });
  });

  return parsed;
};

export const getL2DeployedContractInstancesByBlockHash = async (
  blockHash: HexString,
  includeArtifactJson?: boolean,
): Promise<ChicmozL2ContractInstanceDeluxe[]> => {
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
      isOrphaned: isNotNull(l2Block.orphan_timestamp),
    })
    .from(l2ContractInstanceDeployed)
    .innerJoin(
      l2ContractClassRegistered,
      and(
        eq(
          l2ContractInstanceDeployed.currentContractClassId,
          l2ContractClassRegistered.contractClassId,
        ),
        eq(
          l2ContractInstanceDeployed.version,
          l2ContractClassRegistered.version,
        ),
      ),
    )
    .innerJoin(l2Block, eq(l2Block.hash, l2ContractInstanceDeployed.blockHash))
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
      and(
        eq(
          l2ContractInstanceDeployed.address,
          l2ContractInstanceDeployerMetadataTable.address,
        ),
      ),
    )
    .where(eq(l2ContractInstanceDeployed.blockHash, blockHash))
    .orderBy(desc(l2ContractInstanceDeployed.version));

  return result.map((r) => {
    return parseDeluxe({
      contractClass: r.class,
      instance: r.instance,
      verifiedDeploymentArguments: r.verifiedDeploymentArguments,
      deployerMetadata: r.deployerMetadata,
      aztecScanNotes: null,
      isOrphaned: Boolean(r.isOrphaned),
    });
  });
};

export const getL2DeployedContractInstancesByCurrentContractClassId = async (
  currentContractClassId: string,
  includeArtifactJson?: boolean,
): Promise<ChicmozL2ContractInstanceDeluxe[]> => {
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
      blockHeight: l2Block.height,
      isOrphaned: isNotNull(l2Block.orphan_timestamp),
    })
    .from(l2ContractInstanceDeployed)
    .innerJoin(
      l2ContractClassRegistered,
      and(
        eq(
          l2ContractInstanceDeployed.currentContractClassId,
          l2ContractClassRegistered.contractClassId,
        ),
        eq(
          l2ContractInstanceDeployed.version,
          l2ContractClassRegistered.version,
        ),
      ),
    )
    .leftJoin(l2Block, eq(l2ContractInstanceDeployed.blockHash, l2Block.hash))
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
      and(
        eq(
          l2ContractInstanceDeployed.address,
          l2ContractInstanceDeployerMetadataTable.address,
        ),
      ),
    )
    .where(
      eq(
        l2ContractInstanceDeployed.currentContractClassId,
        currentContractClassId,
      ),
    )
    .orderBy(desc(l2ContractInstanceDeployed.version))
    .limit(DB_MAX_CONTRACTS);

  return result.map((r) => {
    return parseDeluxe({
      contractClass: r.class,
      instance: r.instance,
      verifiedDeploymentArguments: r.verifiedDeploymentArguments,
      deployerMetadata: r.deployerMetadata,
      aztecScanNotes: null,
      isOrphaned: Boolean(r.isOrphaned || false),
    });
  });
};
