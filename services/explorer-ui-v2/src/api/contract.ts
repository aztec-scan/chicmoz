import {
  aztecScanNoteSchema,
  type ChicmozContractInstanceBalance,
  type ChicmozL2ContractClassRegisteredEvent,
  type ChicmozL2ContractInstanceDeluxe,
  type ChicmozL2PrivateFunctionBroadcastedEvent,
  type ChicmozL2UtilityFunctionBroadcastedEvent,
  chicmozContractInstanceBalanceSchema,
  chicmozL2ContractClassRegisteredEventSchema,
  chicmozL2ContractInstanceDeluxeSchema,
  chicmozL2PrivateFunctionBroadcastedEventSchema,
  chicmozL2UtilityFunctionBroadcastedEventSchema,
  sourceCodeEntrySchema,
} from "@chicmoz-pkg/types";
import { z } from "zod";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

const contractClassSourceResponseSchema = z.object({
  contractClassId: z.string(),
  version: z.number(),
  sourceCodeUrl: z.string().nullable().optional(),
  sourceCodeCommitHash: z.string().nullable().optional(),
  gitRef: z.string().nullable().optional(),
  aztecVersion: z.string().nullable().optional(),
  sourceCode: sourceCodeEntrySchema.array(),
});

const contractInstanceBalanceResponseSchema =
  chicmozContractInstanceBalanceSchema.nullable();

const contractInstancesWithAztecScanNotesSchema = z.lazy(() =>
  z.object({
    ...chicmozL2ContractInstanceDeluxeSchema.schema.shape,
    aztecScanNotes: aztecScanNoteSchema,
  }),
);

export type ContractClassSourceResponse = z.infer<
  typeof contractClassSourceResponseSchema
>;

const contractInstanceFpcRelationshipsSchema = z.object({
  feePayers: z.array(z.string()),
  sponsoredAddresses: z.array(z.string()),
});

export type ContractInstanceFpcRelationships = z.infer<
  typeof contractInstanceFpcRelationshipsSchema
>;

const contractInstanceFpcRelationshipsSchema = z.object({
  feePayers: z.array(z.string()),
  sponsoredAddresses: z.array(z.string()),
});

export type ContractInstanceFpcRelationships = z.infer<
  typeof contractInstanceFpcRelationshipsSchema
>;

export const ContractL2API = {
  getContractClass: async ({
    classId,
    version,
  }: {
    classId: string;
    version: string;
  }): Promise<ChicmozL2ContractClassRegisteredEvent> => {
    const response = await client.get(
      aztecExplorer.getL2ContractClassByIdAndVersion(classId, version),
    );
    return validateResponse(
      chicmozL2ContractClassRegisteredEventSchema,
      response.data,
    );
  },
  getContractClasses: async (
    classId?: string,
    verifiedSourceOnly?: boolean,
    offset?: number,
    limit?: number,
    verified?: boolean,
    protocol?: boolean,
  ): Promise<ChicmozL2ContractClassRegisteredEvent[]> => {
    const params: Record<string, string | boolean | number | undefined> = {};
    if (classId) {
      params.classId = classId;
    }
    if (verifiedSourceOnly !== undefined) {
      params.verifiedSourceOnly = verifiedSourceOnly;
    }
    if (offset !== undefined) {
      params.offset = offset;
    }
    if (limit !== undefined) {
      params.limit = limit;
    }
    if (verified !== undefined) {
      params.verified = verified;
    }
    if (protocol !== undefined) {
      params.protocol = protocol;
    }
    const response = await client.get(
      aztecExplorer.getL2ContractClasses(classId),
      { params: classId ? undefined : params },
    );
    return validateResponse(
      chicmozL2ContractClassRegisteredEventSchema.array(),
      response.data,
    );
  },
  getContractClassPrivateFunctions: async (
    classId: string,
  ): Promise<ChicmozL2PrivateFunctionBroadcastedEvent[]> => {
    const response = await client.get(
      aztecExplorer.getL2ContractClassPrivateFunctions(classId),
    );
    return validateResponse(
      chicmozL2PrivateFunctionBroadcastedEventSchema.array(),
      response.data,
    );
  },
  getContractClassUtilityFunctions: async (
    classId: string,
  ): Promise<ChicmozL2UtilityFunctionBroadcastedEvent[]> => {
    const response = await client.get(
      aztecExplorer.getL2ContractClassUtilityFunctions(classId),
    );
    return validateResponse(
      chicmozL2UtilityFunctionBroadcastedEventSchema.array(),
      response.data,
    );
  },
  getContractInstance: async (
    address: string,
  ): Promise<ChicmozL2ContractInstanceDeluxe> => {
    const response = await client.get(
      aztecExplorer.getL2ContractInstance(address),
    );
    return validateResponse(
      chicmozL2ContractInstanceDeluxeSchema,
      response.data,
    );
  },
  getContractInstanceBalance: async (
    address: string,
  ): Promise<ChicmozContractInstanceBalance | null> => {
    const response = await client.get(
      aztecExplorer.getL2ContractInstanceBalance(address),
    );
    return validateResponse(
      contractInstanceBalanceResponseSchema,
      response.data,
    );
  },
  getContractInstanceBalanceHistory: async (
    address: string,
  ): Promise<ChicmozContractInstanceBalance[]> => {
    const response = await client.get(
      aztecExplorer.getL2ContractInstanceBalanceHistory(address),
    );
    return validateResponse(
      chicmozContractInstanceBalanceSchema.array(),
      response.data,
    );
  },
  getContractInstanceFpcRelationships: async (
    address: string,
  ): Promise<ContractInstanceFpcRelationships> => {
    const response = await client.get(
      aztecExplorer.getL2ContractInstanceFpcRelationships(address),
    );
    return validateResponse(
      contractInstanceFpcRelationshipsSchema,
      response.data,
    );
  },
  getContractInstances: async (
    offset?: number,
    limit?: number,
    verified?: boolean,
    protocol?: boolean,
  ): Promise<ChicmozL2ContractInstanceDeluxe[]> => {
    const params: Record<string, number | boolean | undefined> = {};
    if (offset !== undefined) {
      params.offset = offset;
    }
    if (limit !== undefined) {
      params.limit = limit;
    }
    if (verified !== undefined) {
      params.verified = verified;
    }
    if (protocol !== undefined) {
      params.protocol = protocol;
    }
    const response = await client.get(aztecExplorer.getL2ContractInstances, {
      params,
    });
    return validateResponse(
      chicmozL2ContractInstanceDeluxeSchema.array(),
      response.data,
    );
  },
  getContractInstancesWithAztecScanNotes: async (): Promise<
    ChicmozL2ContractInstanceWithAztecScanNotes[]
  > => {
    const response = await client.get(
      aztecExplorer.getL2ContractInstancesWithAztecScanNotes,
    );
    return validateResponse(
      contractInstancesWithAztecScanNotesSchema.array(),
      response.data,
    );
  },
  getContractInstancesByClassId: async (
    classId: string,
  ): Promise<ChicmozL2ContractInstanceDeluxe[]> => {
    const response = await client.get(
      aztecExplorer.getL2ContractInstancesByClassId(classId),
    );
    return validateResponse(
      chicmozL2ContractInstanceDeluxeSchema.array(),
      response.data,
    );
  },
  getContractClassSource: async ({
    classId,
    version,
  }: {
    classId: string;
    version: string;
  }): Promise<ContractClassSourceResponse> => {
    const response = await client.get(
      aztecExplorer.getL2ContractClassSource(classId, version),
    );
    return validateResponse(contractClassSourceResponseSchema, response.data);
  },
  submitStandardContract: async ({
    classId,
    version,
    standardVersion,
    standardName,
  }: {
    classId: string;
    version: string;
    standardVersion: string;
    standardName: string;
  }): Promise<ChicmozL2ContractClassRegisteredEvent> => {
    const response = await client.post(
      aztecExplorer.postL2ContractClassStandardArtifact(classId, version),
      {
        version: standardVersion,
        name: standardName,
      },
    );
    return validateResponse(
      chicmozL2ContractClassRegisteredEventSchema,
      response.data,
    );
  },
};
