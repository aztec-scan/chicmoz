import {
  FeeJuicePortalAbi,
  GovernanceAbi,
  GovernanceProposerAbi,
  InboxAbi,
  OutboxAbi,
  RegistryAbi,
  RollupAbi,
} from "@aztec/l1-artifacts";
import { type PublicClient, getContract } from "viem";

type AztecAbi =
  | typeof RollupAbi
  | typeof RegistryAbi
  | typeof InboxAbi
  | typeof OutboxAbi
  | typeof FeeJuicePortalAbi
  | typeof GovernanceAbi
  | typeof GovernanceProposerAbi;

export const getTypedContract = <T extends AztecAbi>(
  abi: T,
  address: `0x${string}`,
  client: PublicClient
) => {
  return getContract({
    abi,
    address,
    client,
  });
};

export type RollupContract = ReturnType<
  typeof getTypedContract<typeof RollupAbi>
>;
export type RegistryContract = ReturnType<
  typeof getTypedContract<typeof RegistryAbi>
>;
export type InboxContract = ReturnType<
  typeof getTypedContract<typeof InboxAbi>
>;
export type OutboxContract = ReturnType<
  typeof getTypedContract<typeof OutboxAbi>
>;
export type FeeJuicePortalContract = ReturnType<
  typeof getTypedContract<typeof FeeJuicePortalAbi>
>;
export type GovernanceContract = ReturnType<
  typeof getTypedContract<typeof GovernanceAbi>
>;
export type GovernanceProposerContract = ReturnType<
  typeof getTypedContract<typeof GovernanceProposerAbi>
>;

export type AztecContracts = {
  rollup: RollupContract;
  registry: RegistryContract;
  inbox: InboxContract;
  outbox: OutboxContract;
  feeJuicePortal: FeeJuicePortalContract;
  governance: GovernanceContract;
  governanceProposer: GovernanceProposerContract;
};

export type AztecContract =
  | RollupContract
  | RegistryContract
  | InboxContract
  | OutboxContract
  | FeeJuicePortalContract
  | GovernanceContract
  | GovernanceProposerContract;

export type UnwatchCallback = () => void;
