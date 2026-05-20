import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL2ContractInstanceDeluxe, HexString } from "@chicmoz-pkg/types";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  isNotNull,
  isNull,
} from "drizzle-orm";
import { DB_MAX_CONTRACTS } from "../../../../environment.js";
import { globalVariables, header, l2Block } from "../../schema/index.js";
import {
  l2ContractClassRegistered,
  l2ContractInstanceAztecScanNotes,
  l2ContractInstanceDeployed,
  l2ContractInstanceDeployerMetadataTable,
  l2ContractInstanceVerifiedDeploymentArguments,
} from "../../schema/l2contract/index.js";
import { getBlocksWhereRange } from "../utils.js";
import { getCurrentRollupVersionNumber } from "../l2/chain-info/rollup-version-cache.js";
import { getContractClassRegisteredColumns, parseDeluxe } from "./utils.js";

const DEFAULT_SORT =
  (desc(l2ContractInstanceDeployed.version), desc(l2Block.height));

export const getL2DeployedContractInstancesWithAztecScanNotes = async (
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
      aztecScanNotes: getTableColumns(l2ContractInstanceAztecScanNotes),
      isOrphaned: isNotNull(l2Block.orphan_timestamp),
    })
    .from(l2ContractInstanceAztecScanNotes)
    .innerJoin(
      l2ContractInstanceDeployed,
      eq(
        l2ContractInstanceAztecScanNotes.address,
        l2ContractInstanceDeployed.address,
      ),
    )
    .innerJoin(l2Block, eq(l2ContractInstanceDeployed.blockHash, l2Block.hash))
    .innerJoin(header, eq(l2Block.hash, header.blockHash))
    .innerJoin(globalVariables, eq(header.id, globalVariables.headerId))
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
    .leftJoin(
      l2ContractInstanceVerifiedDeploymentArguments,
      eq(
        l2ContractInstanceDeployed.address,
        l2ContractInstanceVerifiedDeploymentArguments.address,
      ),
    )
    .leftJoin(
      l2ContractInstanceDeployerMetadataTable,
      eq(
        l2ContractInstanceDeployed.address,
        l2ContractInstanceDeployerMetadataTable.address,
      ),
    );

  return result.map(
    ({
      instance,
      class: contractClass,
      verifiedDeploymentArguments,
      deployerMetadata,
      aztecScanNotes,
      isOrphaned,
    }) =>
      parseDeluxe({
        contractClass,
        instance,
        verifiedDeploymentArguments,
        deployerMetadata,
        aztecScanNotes,
        isOrphaned: Boolean(isOrphaned),
      }),
  );
};

export const getL2DeployedContractInstances = async ({
  fromHeight,
  toHeight,
  includeArtifactJson,
  offset,
  limit,
  verified,
  protocol,
}: {
  fromHeight?: bigint;
  toHeight?: bigint;
  includeArtifactJson?: boolean;
  offset?: number;
  limit?: number;
  verified?: boolean;
  protocol?: boolean;
}): Promise<ChicmozL2ContractInstanceDeluxe[]> => {
  const rollupVersion = await getCurrentRollupVersionNumber();
  const whereRange = getBlocksWhereRange({ from: fromHeight, to: toHeight });
  const queryLimit = limit ?? DB_MAX_CONTRACTS;
  const baseFilters = [
    whereRange,
    isNull(l2Block.orphan_timestamp),
    rollupVersion !== null ? eq(l2Block.version, rollupVersion) : undefined,
  ];

  if (verified) {
    baseFilters.push(
      isNotNull(l2ContractInstanceVerifiedDeploymentArguments.address),
    );
  }
  if (protocol) {
    baseFilters.push(isNotNull(l2ContractClassRegistered.standardContractType));
  }

  const query = db()
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
    .where(and(...baseFilters))
    .orderBy(DEFAULT_SORT)
    .limit(queryLimit);

  const finalQuery =
    offset !== undefined && offset > 0 ? query.offset(offset) : query;
  const result = await finalQuery;

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

export const getL2TotalAmountDeployedContractInstancesByCurrentContractClassId =
  async (contractClassId: string): Promise<number> => {
    const result = await db()
      .select({
        count: count(),
      })
      .from(l2ContractInstanceDeployed)
      .innerJoin(
        l2Block,
        eq(l2Block.hash, l2ContractInstanceDeployed.blockHash),
      )
      .where(
        eq(l2ContractInstanceDeployed.currentContractClassId, contractClassId),
      );

    return Number(result[0].count);
  };

export const getL2TotalAmountDeployedContractInstances =
  async (): Promise<number> => {
    const result = await db()
      .select({
        count: count(),
      })
      .from(l2ContractInstanceDeployed)
      .innerJoin(
        l2Block,
        eq(l2Block.hash, l2ContractInstanceDeployed.blockHash),
      )
      .where(isNull(l2Block.orphan_timestamp));

    return Number(result[0].count);
  };
