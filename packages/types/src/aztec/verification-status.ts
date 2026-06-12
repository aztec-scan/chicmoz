import type {
  ChicmozL2ContractClassRegisteredEvent,
} from "./l2Contract.js";
import type { ChicmozL2ContractInstanceDeluxe } from "./special.js";

export type ContractClassVerificationStatus = {
  artifactVerified: boolean;
  sourceVerified: boolean;
};

export type ContractInstanceVerificationStatus =
  ContractClassVerificationStatus & {
    deploymentVerified: boolean;
    aztecScanNotesListed: boolean;
  };

export const getContractClassVerificationStatus = (
  contractClass: Pick<
    ChicmozL2ContractClassRegisteredEvent,
    "artifactContractName" | "artifactJson" | "sourceCodeUrl"
  >,
): ContractClassVerificationStatus => ({
  artifactVerified: Boolean(
    contractClass.artifactContractName ?? contractClass.artifactJson,
  ),
  sourceVerified: Boolean(contractClass.sourceCodeUrl),
});

export const getContractInstanceVerificationStatus = (
  contractInstance: Pick<
    ChicmozL2ContractInstanceDeluxe,
    | "artifactContractName"
    | "artifactJson"
    | "sourceCodeUrl"
    | "verifiedDeploymentArguments"
    | "aztecScanNotes"
  >,
): ContractInstanceVerificationStatus => ({
  ...getContractClassVerificationStatus(contractInstance),
  deploymentVerified: Boolean(contractInstance.verifiedDeploymentArguments),
  aztecScanNotesListed: Boolean(contractInstance.aztecScanNotes),
});
