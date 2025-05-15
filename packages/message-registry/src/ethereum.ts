import {
  ChicmozL1GenericContractEvent,
  ChicmozL1L2BlockProposed,
  ChicmozL1L2ProofVerified,
  ChicmozL1L2Validator,
  EthAddress,
  L1NetworkId,
  L2NetworkId,
} from "@chicmoz-pkg/types";

export type ConnectedToL1Event = {
  something: string;
};

export type NewL1Event = {
  contractAddress: EthAddress;
  l1BlockNumber: number;
  data: unknown;
};

export type L1L2ValidatorEvent = {
  validators: (Omit<ChicmozL1L2Validator, "stake"> & { stake: string })[];
};

export type L1Topic = `${L2NetworkId}_${L1NetworkId}__${keyof L1_MESSAGES}`;

export function generateL1TopicName(
  l2NetworkId: L2NetworkId,
  l1NetworkId: L1NetworkId,
  topic: keyof L1_MESSAGES,
): L1Topic {
  return `${l2NetworkId}_${l1NetworkId}__${topic}`;
}

export type L1_MESSAGES = {
  CONNECTED_TO_L1_EVENT: ConnectedToL1Event;
  NEW_L1_EVENT: NewL1Event;
  L1_L2_VALIDATOR_EVENT: L1L2ValidatorEvent;
  L1_L2_BLOCK_PROPOSED_EVENT: ChicmozL1L2BlockProposed;
  L1_L2_PROOF_VERIFIED_EVENT: ChicmozL1L2ProofVerified;
  L1_GENERIC_CONTRACT_EVENT: ChicmozL1GenericContractEvent;
};

export type L1Payload = L1_MESSAGES[keyof L1_MESSAGES];
