import { HexString } from "@chicmoz-pkg/types";
import { relations } from "drizzle-orm";
import {
  bigint,
  foreignKey,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { l2Block } from "../index.js";
import {
  bufferType,
  contractTypeDbEnum,
  generateAztecAddressColumn,
  generateConcatFrPointColumn,
  generateFrColumn,
} from "../utils.js";

export const l2ContractInstanceDeployed = pgTable(
  "l2_contract_instance_deployed",
  {
    // TODO: perhaps a different name for this column?
    id: uuid("id").primaryKey().defaultRandom(),
    blockHash: varchar("block_hash")
      .$type<HexString>()
      .notNull()
      .references(() => l2Block.hash, { onDelete: "cascade" }),
    address: generateAztecAddressColumn("address").notNull().unique(),
    version: integer("version").notNull(),
    salt: generateFrColumn("salt").notNull(), // TODO: maybe should not be here?
    contractClassId: generateFrColumn("contract_class_id").notNull(),
    initializationHash: generateFrColumn("initialization_hash").notNull(),
    deployer: generateAztecAddressColumn("deployer").notNull(),
    masterNullifierPublicKey: generateConcatFrPointColumn(
      "masterNullifierPublicKey",
    ).notNull(),
    masterIncomingViewingPublicKey: generateConcatFrPointColumn(
      "masterIncomingViewingPublicKey",
    ).notNull(),
    masterOutgoingViewingPublicKey: generateConcatFrPointColumn(
      "masterOutgoingViewingPublicKey",
    ).notNull(),
    masterTaggingPublicKey: generateConcatFrPointColumn(
      "masterTaggingPublicKey",
    ).notNull(),
  },
  (t) => ({
    contractClass: foreignKey({
      name: "contract_class",
      columns: [t.contractClassId, t.version],
      foreignColumns: [
        l2ContractClassRegistered.contractClassId,
        l2ContractClassRegistered.version,
      ],
    }).onDelete("cascade"),
  }),
);

export const l2ContractClassRegistered = pgTable(
  "l2_contract_class_registered",
  {
    blockHash: varchar("block_hash")
      .notNull()
      .$type<HexString>()
      .references(() => l2Block.hash, { onDelete: "cascade" }),
    contractClassId: generateFrColumn("contract_class_id").notNull(),
    version: bigint("version", { mode: "number" }).notNull(),
    artifactHash: generateFrColumn("artifact_hash").notNull(),
    privateFunctionsRoot: generateFrColumn("private_functions_root").notNull(),
    packedBytecode: bufferType("packed_bytecode").notNull(),
    artifactJson: varchar("artifact_json"),
    artifactContractName: varchar("artifact_contract_name"),
    contractType: contractTypeDbEnum("contract_type"),
  },
  (t) => ({
    primaryKey: primaryKey({
      name: "contract_class_id_version",
      columns: [t.contractClassId, t.version],
    }),
  }),
);

export const l2ContractInstanceDeployerMetadataTable = pgTable(
  "l2_contract_instance_deployer_metadata",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    address: generateAztecAddressColumn("address")
      .notNull()
      .references(() => l2ContractInstanceDeployed.address, {
        onDelete: "cascade",
      }),
    contractIdentifier: varchar("contract_identifier").notNull(),
    details: varchar("details").notNull(),
    creatorName: varchar("creator_name").notNull(),
    creatorContact: varchar("creator_contact").notNull(),
    appUrl: varchar("app_url").notNull(),
    repoUrl: varchar("repo_url").notNull(),
    uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at"),
  },
);

export const l2ContractInstanceAztecScanNotes = pgTable(
  "l2_contract_instance_aztec_scan_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    address: generateAztecAddressColumn("address")
      .notNull()
      .references(() => l2ContractInstanceDeployed.address, {
        onDelete: "cascade",
      }),
    origin: varchar("origin").notNull(),
    comment: varchar("comment").notNull(),
    relatedL1ContractAddresses: jsonb("related_l1_contract_addresses"),
    uploadedAt: timestamp("uploaded_at").notNull().defaultNow(), // TODO: rename to updatedAt
  },
);

export const l2ContractInstanceVerifiedDeploymentArguments = pgTable(
  "l2_contract_instance_verified_deployment_arguments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    address: generateAztecAddressColumn("address")
      .notNull()
      .references(() => l2ContractInstanceDeployed.address, {
        onDelete: "cascade",
      }),
    publicKeysString: varchar("publicKeys").notNull(),
    deployer: generateAztecAddressColumn("deployer").notNull(),
    salt: generateFrColumn("salt").notNull(),
    constructorArgs: jsonb("constructor_args").notNull(),
  },
);

export const l2ContractInstanceDeployedRelations = relations(
  l2ContractInstanceDeployed,
  ({ one, many }) => ({
    deployerMetadata: many(l2ContractInstanceDeployerMetadataTable),
    verifiedDeploymentArguments: one(
      l2ContractInstanceVerifiedDeploymentArguments,
    ),
    contractClass: one(l2ContractClassRegistered, {
      fields: [
        l2ContractInstanceDeployed.contractClassId,
        l2ContractInstanceDeployed.version,
      ],
      references: [
        l2ContractClassRegistered.contractClassId,
        l2ContractClassRegistered.version,
      ],
    }),
    aztecScanNotes: one(l2ContractInstanceAztecScanNotes),
  }),
);

export const l2ContractInstanceAztecScanNotesRelations = relations(
  l2ContractInstanceAztecScanNotes,
  ({ one }) => ({
    contractInstance: one(l2ContractInstanceDeployed, {
      fields: [l2ContractInstanceAztecScanNotes.address],
      references: [l2ContractInstanceDeployed.address],
    }),
  }),
);

export const l2PrivateFunction = pgTable(
  "l2_private_function",
  {
    contractClassId: generateFrColumn("contract_class_id").notNull(),
    artifactMetadataHash: generateFrColumn("artifact_metadata_hash").notNull(),
    unconstrainedFunctionsArtifactTreeRoot: generateFrColumn(
      "unconstrained_functions_artifact_tree_root",
    ).notNull(),
    privateFunctionTreeSiblingPath: jsonb(
      "private_function_tree_sibling_path",
    ).notNull(),
    privateFunctionTreeLeafIndex: bigint("private_function_tree_leaf_index", {
      mode: "number",
    }).notNull(),
    artifactFunctionTreeSiblingPath: jsonb(
      "artifact_function_tree_sibling_path",
    ).notNull(),
    artifactFunctionTreeLeafIndex: bigint("artifact_function_tree_leaf_index", {
      mode: "number",
    }).notNull(),
    privateFunction_selector_value: bigint("private_function_selector_value", {
      mode: "number",
    }).notNull(),
    privateFunction_metadataHash: generateFrColumn(
      "private_function_metadata_hash",
    ).notNull(),
    privateFunction_vkHash: generateFrColumn(
      "private_function_vk_hash",
    ).notNull(),
    privateFunction_bytecode: bufferType("private_function_bytecode").notNull(),
  },
  (t) => ({
    primaryKey: primaryKey({
      name: "private_function_contract_class",
      columns: [t.contractClassId, t.privateFunction_selector_value],
    }),
  }),
);

export const l2UnconstrainedFunction = pgTable(
  "l2_unconstrained_function",
  {
    contractClassId: generateFrColumn("contract_class_id").notNull(),
    artifactMetadataHash: generateFrColumn("artifact_metadata_hash").notNull(),
    privateFunctionsArtifactTreeRoot: generateFrColumn(
      "private_functions_artifact_tree_root",
    ).notNull(),
    artifactFunctionTreeSiblingPath: jsonb(
      "artifact_function_tree_sibling_path",
    ).notNull(),
    artifactFunctionTreeLeafIndex: bigint("artifact_function_tree_leaf_index", {
      mode: "number",
    }).notNull(),
    unconstrainedFunction_selector_value: bigint(
      "unconstrained_function_selector_value",
      { mode: "number" },
    ).notNull(),
    unconstrainedFunction_metadataHash: generateFrColumn(
      "unconstrained_function_metadata_hash",
    ).notNull(),
    unconstrainedFunction_bytecode: bufferType(
      "unconstrained_function_bytecode",
    ).notNull(),
  },
  (t) => ({
    primaryKey: primaryKey({
      name: "unconstrained_function_contract_class",
      columns: [t.contractClassId, t.unconstrainedFunction_selector_value],
    }),
  }),
);

export const l2ContractClassRegisteredRelations = relations(
  l2ContractClassRegistered,
  ({ many }) => ({
    instances: many(l2ContractInstanceDeployed),
    privateFunctions: many(l2PrivateFunction),
    unconstrainedFunctions: many(l2UnconstrainedFunction),
  }),
);

export const l2PrivateFunctionRelations = relations(
  l2PrivateFunction,
  ({ many }) => ({
    contractClass: many(l2ContractClassRegistered),
  }),
);

export const l2UnconstrainedFunctionRelations = relations(
  l2UnconstrainedFunction,
  ({ many }) => ({
    contractClass: many(l2ContractClassRegistered),
  }),
);
