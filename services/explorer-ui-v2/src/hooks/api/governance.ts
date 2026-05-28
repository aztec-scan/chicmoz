import {
  type ChicmozL1GovernanceProposal,
  type ChicmozL1GovernanceVote,
  type ChicmozL1GovernanceSignal,
  type ChicmozL1GovernanceConfiguration,
  type ChicmozL1GovernanceProposerHistory,
} from "@chicmoz-pkg/types";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { GovernanceAPI } from "~/api";
import { LONG_STALE_TIME, queryKeyGenerator } from "./utils";

export const useGovernanceProposals = (params?: {
  state?: string;
  offset?: number;
  limit?: number;
}): UseQueryResult<ChicmozL1GovernanceProposal[], Error> => {
  return useQuery<ChicmozL1GovernanceProposal[], Error>({
    queryKey: queryKeyGenerator.governanceProposals(params),
    queryFn: () => GovernanceAPI.getProposals(params),
    staleTime: LONG_STALE_TIME,
  });
};

export const useGovernanceProposal = (
  proposalId: string,
): UseQueryResult<ChicmozL1GovernanceProposal, Error> => {
  return useQuery<ChicmozL1GovernanceProposal, Error>({
    queryKey: queryKeyGenerator.governanceProposal(proposalId),
    queryFn: () => GovernanceAPI.getProposal(proposalId),
    staleTime: LONG_STALE_TIME,
    enabled: !!proposalId,
  });
};

export const useGovernanceProposalVotes = (
  proposalId: string,
  params?: { support?: boolean; offset?: number; limit?: number },
): UseQueryResult<ChicmozL1GovernanceVote[], Error> => {
  return useQuery<ChicmozL1GovernanceVote[], Error>({
    queryKey: queryKeyGenerator.governanceProposalVotes(proposalId, params),
    queryFn: () => GovernanceAPI.getProposalVotes(proposalId, params),
    staleTime: LONG_STALE_TIME,
    enabled: !!proposalId,
  });
};

export const useGovernanceProposalSignals = (
  proposalId: string,
  params?: { offset?: number; limit?: number },
): UseQueryResult<ChicmozL1GovernanceSignal[], Error> => {
  return useQuery<ChicmozL1GovernanceSignal[], Error>({
    queryKey: queryKeyGenerator.governanceProposalSignals(proposalId, params),
    queryFn: () => GovernanceAPI.getProposalSignals(proposalId, params),
    staleTime: LONG_STALE_TIME,
    enabled: !!proposalId,
  });
};

export const useGovernanceSignals = (params?: {
  payloadAddress?: string;
  round?: number;
  signaler?: string;
  offset?: number;
  limit?: number;
}): UseQueryResult<ChicmozL1GovernanceSignal[], Error> => {
  return useQuery<ChicmozL1GovernanceSignal[], Error>({
    queryKey: queryKeyGenerator.governanceSignals(params),
    queryFn: () => GovernanceAPI.getSignals(params),
    staleTime: LONG_STALE_TIME,
  });
};

export const useGovernanceConfigurations = (params?: {
  offset?: number;
  limit?: number;
}): UseQueryResult<ChicmozL1GovernanceConfiguration[], Error> => {
  return useQuery<ChicmozL1GovernanceConfiguration[], Error>({
    queryKey: queryKeyGenerator.governanceConfigurations(params),
    queryFn: () => GovernanceAPI.getConfigurations(params),
    staleTime: LONG_STALE_TIME,
  });
};

export const useGovernanceProposerHistory = (params?: {
  offset?: number;
  limit?: number;
}): UseQueryResult<ChicmozL1GovernanceProposerHistory[], Error> => {
  return useQuery<ChicmozL1GovernanceProposerHistory[], Error>({
    queryKey: queryKeyGenerator.governanceProposerHistory(params),
    queryFn: () => GovernanceAPI.getProposerHistory(params),
    staleTime: LONG_STALE_TIME,
  });
};
