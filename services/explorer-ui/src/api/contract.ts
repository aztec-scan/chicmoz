import {
  chicmozL2ContractClassRegisteredEventSchema,
  chicmozL2ContractInstanceDeluxeSchema,
  chicmozL2PrivateFunctionBroadcastedEventSchema,
  chicmozL2UnconstrainedFunctionBroadcastedEventSchema,
  type ChicmozL2ContractClassRegisteredEvent,
  type ChicmozL2ContractInstanceDeluxe,
  type ChicmozL2PrivateFunctionBroadcastedEvent,
  type ChicmozL2UnconstrainedFunctionBroadcastedEvent,
} from "@chicmoz-pkg/types";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

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
      }
    );
    return validateResponse(
      chicmozL2ContractClassRegisteredEventSchema,
      response.data
    );
  },
  getContractClasses: async (
    classId?: string
  ): Promise<ChicmozL2ContractClassRegisteredEvent[]> => {
    const response = await client.get(
      aztecExplorer.getL2ContractClasses(classId)
    );
    return validateResponse(
      chicmozL2ContractClassRegisteredEventSchema.array(),
      response.data
    );
  },
  getContractClassPrivateFunctions: async (
    classId: string,
    functionSelector?: string
  ): Promise<ChicmozL2PrivateFunctionBroadcastedEvent[]> => {
    const response = await client.get(
      aztecExplorer.getL2ContractClassPrivateFunctions(
        classId,
        functionSelector
      )
    );
    return validateResponse(
      chicmozL2PrivateFunctionBroadcastedEventSchema.array(),
      response.data
    );
  },
  getL2ContractClassUnconstrainedFunctions: async (
    classId: string,
    functionSelector?: string
  ): Promise<ChicmozL2UnconstrainedFunctionBroadcastedEvent[]> => {
    const response = await client.get(
      aztecExplorer.getL2ContractClassUnconstrainedFunctions(
        classId,
        functionSelector
      )
    );
    return validateResponse(
      chicmozL2UnconstrainedFunctionBroadcastedEventSchema.array(),
      response.data
    );
  },
  getContractInstance: async (
    address: string
  ): Promise<ChicmozL2ContractInstanceDeluxe> => {
    const response = await client.get(
      aztecExplorer.getL2ContractInstance(address)
    );
    return validateResponse(
      chicmozL2ContractInstanceDeluxeSchema,
      response.data
    );
  },
  getContractInstances: async (): Promise<
    ChicmozL2ContractInstanceDeluxe[]
  > => {
    const response = await client.get(aztecExplorer.getL2ContractInstances);
    return validateResponse(
      chicmozL2ContractInstanceDeluxeSchema.array(),
      response.data
    );
  },
  getContracInstanceByBlockHash: async (
    blockHash: string
  ): Promise<ChicmozL2ContractInstanceDeluxe> => {
    const response = await client.get(
      aztecExplorer.getL2ContractInstancesByBlockHash(blockHash)
    );
    return validateResponse(
      chicmozL2ContractInstanceDeluxeSchema,
      response.data
    );
  },
  getContractInstancesByClassId: async (
    classId: string
  ): Promise<ChicmozL2ContractInstanceDeluxe[]> => {
    const response = await client.get(
      aztecExplorer.getL2ContractInstancesByClassId(classId)
    );
    return validateResponse(
      chicmozL2ContractInstanceDeluxeSchema.array(),
      response.data
    );
  },
};
