import {
  aztecScanNoteSchema,
  chicmozL2ContractClassRegisteredEventSchema,
  chicmozL2ContractInstanceDeluxeSchema,
  chicmozL2PrivateFunctionBroadcastedEventSchema,
  chicmozL2UtilityFunctionBroadcastedEventSchema,
  type ChicmozL2ContractClassRegisteredEvent,
  type ChicmozL2ContractInstanceDeluxe,
  type ChicmozL2PrivateFunctionBroadcastedEvent,
  type ChicmozL2UtilityFunctionBroadcastedEvent,
} from "@chicmoz-pkg/types";
import { z } from "zod";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

const contractInstancesWithAztecScanNotesSchema = z.lazy(() =>
  z.object({
    ...chicmozL2ContractInstanceDeluxeSchema.schema.shape,
    aztecScanNotes: aztecScanNoteSchema,
  }),
);

export type ChicmozL2ContractInstanceWithAztecScanNotes = z.infer<
  typeof contractInstancesWithAztecScanNotesSchema
>;

export const ContractL2API = {
  getContractClass: async ({
    classId,
    version,
    includeArtifactJson,
  }: {
    classId: string;
    version: string;
    includeArtifactJson?: boolean;
  }): Promise<ChicmozL2ContractClassRegisteredEvent> => {
    const response = await client.get(
      aztecExplorer.getL2ContractClassByIdAndVersion(classId, version),
      {
        params: {
          includeArtifactJson,
        },
      },
    );
    return validateResponse(
      chicmozL2ContractClassRegisteredEventSchema,
      response.data,
    );
  },
  getContractClasses: async (
    classId?: string,
  ): Promise<ChicmozL2ContractClassRegisteredEvent[]> => {
    const response = await client.get(
      aztecExplorer.getL2ContractClasses(classId),
    );
    return validateResponse(
      chicmozL2ContractClassRegisteredEventSchema.array(),
      response.data,
    );
  },
  getContractClassPrivateFunctions: async (
    classId: string,
    functionSelector?: string,
  ): Promise<ChicmozL2PrivateFunctionBroadcastedEvent[]> => {
    const response = await client.get(
      aztecExplorer.getL2ContractClassPrivateFunctions(
        classId,
        functionSelector,
      ),
    );
    return validateResponse(
      chicmozL2PrivateFunctionBroadcastedEventSchema.array(),
      response.data,
    );
  },
  getL2ContractClassUtilityFunctions: async (
    classId: string,
    functionSelector?: string,
  ): Promise<ChicmozL2UtilityFunctionBroadcastedEvent[]> => {
    const response = await client.get(
      aztecExplorer.getL2ContractClassUtilityFunctions(
        classId,
        functionSelector,
      ),
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
  getContractInstances: async (): Promise<
    ChicmozL2ContractInstanceDeluxe[]
  > => {
    const response = await client.get(aztecExplorer.getL2ContractInstances);
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
  getContracInstanceByBlockHash: async (
    blockHash: string,
  ): Promise<ChicmozL2ContractInstanceDeluxe> => {
    const response = await client.get(
      aztecExplorer.getL2ContractInstancesByBlockHash(blockHash),
    );
    return validateResponse(
      chicmozL2ContractInstanceDeluxeSchema,
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
};
