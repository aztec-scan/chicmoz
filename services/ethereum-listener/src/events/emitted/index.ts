import {
  ChicmozL1GenericContractEvent,
  ChicmozL1L2BlockProposed,
  ChicmozL1L2ProofVerified,
  ChicmozL1L2Validator,
} from "@chicmoz-pkg/types";
import { publishMessage } from "../../svcs/message-bus/index.js";

export const l1Validator = async (validators: ChicmozL1L2Validator[]) => {
  const objsToSend = validators.map((validator) => ({
    ...validator,
    stake: validator.stake.toString(),
  }));
  await publishMessage("L1_L2_VALIDATOR_EVENT", { validators: objsToSend });
};

export const l2BlockProposed = async (
  blockProposed: ChicmozL1L2BlockProposed,
) => {
  await publishMessage("L1_L2_BLOCK_PROPOSED_EVENT", {
    ...blockProposed,
    l2BlockNumber: blockProposed.l2BlockNumber.toString() as unknown as bigint,
    l1BlockNumber: blockProposed.l1BlockNumber.toString() as unknown as bigint,
  });
};

export const l2ProofVerified = async (
  proofVerified: ChicmozL1L2ProofVerified,
) => {
  await publishMessage("L1_L2_PROOF_VERIFIED_EVENT", {
    ...proofVerified,
    l2BlockNumber: proofVerified.l2BlockNumber.toString() as unknown as bigint,
    l1BlockNumber: proofVerified.l1BlockNumber.toString() as unknown as bigint,
  });
};

export const genericContractEvent = async (
  genericContractEvent: ChicmozL1GenericContractEvent,
) => {
  await publishMessage("L1_GENERIC_CONTRACT_EVENT", genericContractEvent);
};
