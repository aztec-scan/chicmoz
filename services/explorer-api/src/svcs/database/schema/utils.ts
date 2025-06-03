import {
  ChicmozL2BlockFinalizationStatus,
  L2NetworkId,
} from "@chicmoz-pkg/types";
import { ColumnBuilderBaseConfig, ColumnDataType } from "drizzle-orm";
import {
  PgColumnBuilderBase,
  bigint,
  customType,
  integer,
  numeric,
  pgTable,
  smallint,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// TODO: this should be changed to be the same as generateUint256Column
export const generateFrColumn = (name: string) => varchar(name, { length: 66 });
export const generateConcatFrPointColumn = (name: string) =>
  varchar(name, { length: 130 });

export const generateUint256Column = (name: string) =>
  numeric(name, { precision: 77, scale: 0 });

// NOTE: remove this function and replace with generateFrColumn. Beware of summarizing operations etc!
export const generateFrNumberColumn = (name: string) =>
  bigint(name, { mode: "number" });

export const generateAztecAddressColumn = (name: string) =>
  varchar(name, { length: 66 });

export const generateEthAddressColumn = (name: string) =>
  varchar(name, { length: 42 });

export const generateTreeTable = (
  name: string,
  fk: PgColumnBuilderBase<
    ColumnBuilderBaseConfig<ColumnDataType, string>,
    object
  >,
) =>
  pgTable(name, {
    id: uuid("id").primaryKey().defaultRandom(),
    root: generateFrColumn("root"),
    nextAvailableLeafIndex: integer("next_available_leaf_index").notNull(),
    fk,
  });

export const bufferType = customType<{
  data: Buffer;
  default: false;
}>({
  dataType() {
    return "bytea";
  },
});

export const l2NetworkIdDbEnum = (name: string) =>
  varchar(name).$type<L2NetworkId>();
export const l2BlockFinalizationStatusDbEnum = (name: string) =>
  smallint(name).$type<ChicmozL2BlockFinalizationStatus>();
