import {
  type ChicmozL2ContractClassRegisteredEvent,
  type ChicmozL2ContractInstanceDeluxe,
} from "@chicmoz-pkg/types";
import { contractClassSchema } from "~/components/contracts/classes/schema";
import { contractInstanceSchema } from "~/components/contracts/instances/schema";

export const mapContractClasses = (
  classesData?: ChicmozL2ContractClassRegisteredEvent[],
) => {
  if (!classesData) return undefined;
  return classesData.map((contractClass) =>
    contractClassSchema.parse({
      blockHash: contractClass.blockHash,
      contractClassId: contractClass.contractClassId,
      version: contractClass.version,
      artifactHash: contractClass.artifactHash,
      privateFunctionsRoot: contractClass.privateFunctionsRoot,
      sourceCodeUrl: contractClass.sourceCodeUrl,
    }),
  );
};

export const mapContractInstances = (
  instancesData?: ChicmozL2ContractInstanceDeluxe[],
) => {
  if (!instancesData) return undefined;
  return instancesData.map((contractInstance) =>
    contractInstanceSchema.parse({
      address: contractInstance.address,
      blockHash: contractInstance.blockHash,
      blockHeight: contractInstance.blockHeight,
      version: contractInstance.version,
      contractClassId: contractInstance.contractClassId,
      deployer: contractInstance.deployer,
    }),
  );
};
