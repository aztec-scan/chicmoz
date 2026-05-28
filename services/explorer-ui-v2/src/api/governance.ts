import {
  type ChicmozL1GovernanceProposal,
  type ChicmozL1GovernanceVote,
  type ChicmozL1GovernanceSignal,
  type ChicmozL1GovernanceConfiguration,
  type ChicmozL1GovernanceProposerHistory,
  chicmozL1GovernanceProposalSchema,
  chicmozL1GovernanceVoteSchema,
  chicmozL1GovernanceSignalSchema,
  chicmozL1GovernanceConfigurationSchema,
  chicmozL1GovernanceProposerHistorySchema,
} from "@chicmoz-pkg/types";
import { z } from "zod";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

export const GovernanceAPI = {
  getProposals: async (params?: {
    state?: string;
    offset?: number;
    limit?: number;
  }): Promise<ChicmozL1GovernanceProposal[]> => {
    const response = await client.get(aztecExplorer.getGovernanceProposals, {
      params,
    });
    return validateResponse(
      z.array(chicmozL1GovernanceProposalSchema),
      response.data,
    );
  },

  getProposal: async (
    proposalId: string,
  ): Promise<ChicmozL1GovernanceProposal> => {
    const response = await client.get(
      aztecExplorer.getGovernanceProposal(proposalId),
    );
    return validateResponse(chicmozL1GovernanceProposalSchema, response.data);
  },

  getProposalVotes: async (
    proposalId: string,
    params?: { support?: boolean; offset?: number; limit?: number },
  ): Promise<ChicmozL1GovernanceVote[]> => {
    const response = await client.get(
      aztecExplorer.getGovernanceProposalVotes(proposalId),
      { params },
    );
    return validateResponse(
      z.array(chicmozL1GovernanceVoteSchema),
      response.data,
    );
  },

  getProposalSignals: async (
    proposalId: string,
    params?: { offset?: number; limit?: number },
  ): Promise<ChicmozL1GovernanceSignal[]> => {
    const response = await client.get(
      aztecExplorer.getGovernanceProposalSignals(proposalId),
      { params },
    );
    return validateResponse(
      z.array(chicmozL1GovernanceSignalSchema),
      response.data,
    );
  },

  getSignals: async (params?: {
    payloadAddress?: string;
    round?: number;
    signaler?: string;
    offset?: number;
    limit?: number;
  }): Promise<ChicmozL1GovernanceSignal[]> => {
    const response = await client.get(aztecExplorer.getGovernanceSignals, {
      params,
    });
    return validateResponse(
      z.array(chicmozL1GovernanceSignalSchema),
      response.data,
    );
  },

  getConfigurations: async (params?: {
    offset?: number;
    limit?: number;
  }): Promise<ChicmozL1GovernanceConfiguration[]> => {
    const response = await client.get(
      aztecExplorer.getGovernanceConfigurations,
      { params },
    );
    return validateResponse(
      z.array(chicmozL1GovernanceConfigurationSchema),
      response.data,
    );
  },

  getProposerHistory: async (params?: {
    offset?: number;
    limit?: number;
  }): Promise<ChicmozL1GovernanceProposerHistory[]> => {
    const response = await client.get(
      aztecExplorer.getGovernanceProposerHistory,
      { params },
    );
    return validateResponse(
      z.array(chicmozL1GovernanceProposerHistorySchema),
      response.data,
    );
  },
};
