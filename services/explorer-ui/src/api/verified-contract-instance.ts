import {
  chicmozL2ContractInstanceDeployerMetadataSchema,
  type ChicmozL2ContractInstanceDeployerMetadata,
} from "@chicmoz-pkg/types";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

export const VerifiedContractInstanceL2API = {
  getVerifiedContract: async (
    address: string
  ): Promise<ChicmozL2ContractInstanceDeployerMetadata> => {
    const response = await client.get(
      aztecExplorer.getL2VerifiedContractByInstanceAddress(address)
    );
    return validateResponse(
      chicmozL2ContractInstanceDeployerMetadataSchema,
      response.data
    );
  },
  getVerifiedContracts: async (): Promise<
    ChicmozL2ContractInstanceDeployerMetadata[]
  > => {
    const response = await client.get(aztecExplorer.getL2VerifiedContracts);
    return validateResponse(
      chicmozL2ContractInstanceDeployerMetadataSchema.array(),
      response.data
    );
  },
};
