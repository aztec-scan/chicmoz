import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { queries } from "../../../database/controllers/l1/governance/index.js";
import {
  getGovernanceProposalsSchema,
  getGovernanceProposalSchema,
  getGovernanceProposalVotesSchema,
  getGovernanceProposalSignalsSchema,
  getGovernanceSignalsSchema,
  getGovernanceSignalsByRoundSchema,
  getGovernanceSignalsByPayloadSchema,
  getGovernanceConfigurationsSchema,
  getGovernanceProposerHistorySchema,
  paths,
} from "../paths_and_validation.js";

// ── GET /l1/governance/proposals ─────────────────────────────────────────────

export const openapi_GET_L1_GOVERNANCE_PROPOSALS: OpenAPIObject["paths"] = {
  [paths.governanceProposals]: {
    get: {
      tags: ["L1", "governance"],
      summary: "List governance proposals",
      parameters: [
        { name: "state", in: "query", schema: { type: "string" } },
        { name: "from", in: "query", schema: { type: "integer" } },
        { name: "to", in: "query", schema: { type: "integer" } },
        {
          name: "offset",
          in: "query",
          schema: { type: "integer", default: 0 },
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 20, maximum: 100 },
        },
      ],
      responses: {
        "200": { description: "List of governance proposals" },
      },
    },
  },
};

export const GET_L1_GOVERNANCE_PROPOSALS = asyncHandler(async (req, res) => {
  const parsed = getGovernanceProposalsSchema.parse(req);
  const proposals = await queries.getProposals(parsed.query);
  res.status(200).json(proposals);
});

// ── GET /l1/governance/proposals/:proposalId ─────────────────────────────────

export const openapi_GET_L1_GOVERNANCE_PROPOSAL: OpenAPIObject["paths"] = {
  [paths.governanceProposal]: {
    get: {
      tags: ["L1", "governance"],
      summary: "Get a single governance proposal",
      parameters: [
        {
          name: "proposalId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": { description: "Proposal detail" },
        "404": { description: "Proposal not found" },
      },
    },
  },
};

export const GET_L1_GOVERNANCE_PROPOSAL = asyncHandler(async (req, res) => {
  const parsed = getGovernanceProposalSchema.parse(req);
  const proposal = await queries.getProposalById(parsed.params.proposalId);
  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }
  res.status(200).json(proposal);
});

// ── GET /l1/governance/proposals/:proposalId/votes ───────────────────────────

export const openapi_GET_L1_GOVERNANCE_PROPOSAL_VOTES: OpenAPIObject["paths"] = {
  [paths.governanceProposalVotes]: {
    get: {
      tags: ["L1", "governance"],
      summary: "List votes for a proposal",
      parameters: [
        {
          name: "proposalId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "support",
          in: "query",
          schema: { type: "boolean" },
        },
        {
          name: "offset",
          in: "query",
          schema: { type: "integer", default: 0 },
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 50, maximum: 100 },
        },
      ],
      responses: { "200": { description: "List of votes" } },
    },
  },
};

export const GET_L1_GOVERNANCE_PROPOSAL_VOTES = asyncHandler(async (req, res) => {
  const parsed = getGovernanceProposalVotesSchema.parse(req);
  const votes = await queries.getProposalVotes(
    parsed.params.proposalId,
    parsed.query,
  );
  res.status(200).json(votes);
});

// ── GET /l1/governance/proposals/:proposalId/signals ─────────────────────────

export const openapi_GET_L1_GOVERNANCE_PROPOSAL_SIGNALS: OpenAPIObject["paths"] = {
  [paths.governanceProposalSignals]: {
    get: {
      tags: ["L1", "governance"],
      summary: "List signals related to a proposal (by payload address)",
      parameters: [
        {
          name: "proposalId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "offset",
          in: "query",
          schema: { type: "integer", default: 0 },
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 50, maximum: 100 },
        },
      ],
      responses: {
        "200": { description: "List of signals" },
        "404": { description: "Proposal not found" },
      },
    },
  },
};

export const GET_L1_GOVERNANCE_PROPOSAL_SIGNALS = asyncHandler(
  async (req, res) => {
    const parsed = getGovernanceProposalSignalsSchema.parse(req);
    const proposal = await queries.getProposalById(parsed.params.proposalId);
    if (!proposal) {
      res.status(404).json({ error: "Proposal not found" });
      return;
    }
    const signals = await queries.getProposalSignals(
      proposal.payloadAddress,
      parsed.query,
    );
    res.status(200).json(signals);
  },
);

// ── GET /l1/governance/signals ───────────────────────────────────────────────

export const openapi_GET_L1_GOVERNANCE_SIGNALS: OpenAPIObject["paths"] = {
  [paths.governanceSignals]: {
    get: {
      tags: ["L1", "governance"],
      summary: "List all governance signals",
      parameters: [
        {
          name: "payloadAddress",
          in: "query",
          schema: { type: "string" },
        },
        { name: "round", in: "query", schema: { type: "integer" } },
        { name: "signaler", in: "query", schema: { type: "string" } },
        {
          name: "offset",
          in: "query",
          schema: { type: "integer", default: 0 },
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 50, maximum: 100 },
        },
      ],
      responses: { "200": { description: "List of signals" } },
    },
  },
};

export const GET_L1_GOVERNANCE_SIGNALS = asyncHandler(async (req, res) => {
  const parsed = getGovernanceSignalsSchema.parse(req);
  const signals = await queries.getSignals(parsed.query);
  res.status(200).json(signals);
});

// ── GET /l1/governance/signals/round/:round ──────────────────────────────────

export const openapi_GET_L1_GOVERNANCE_SIGNALS_BY_ROUND: OpenAPIObject["paths"] = {
  [paths.governanceSignalsByRound]: {
    get: {
      tags: ["L1", "governance"],
      summary: "List all signals in a specific round",
      parameters: [
        {
          name: "round",
          in: "path",
          required: true,
          schema: { type: "integer" },
        },
      ],
      responses: { "200": { description: "List of signals for the round" } },
    },
  },
};

export const GET_L1_GOVERNANCE_SIGNALS_BY_ROUND = asyncHandler(async (req, res) => {
  const parsed = getGovernanceSignalsByRoundSchema.parse(req);
  const signals = await queries.getSignalsByRound(parsed.params.round);
  res.status(200).json(signals);
});

// ── GET /l1/governance/signals/payload/:payloadAddress ───────────────────────

export const openapi_GET_L1_GOVERNANCE_SIGNALS_BY_PAYLOAD: OpenAPIObject["paths"] = {
  [paths.governanceSignalsByPayload]: {
    get: {
      tags: ["L1", "governance"],
      summary: "List all signals for a specific payload",
      parameters: [
        {
          name: "payloadAddress",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: { "200": { description: "List of signals for the payload" } },
    },
  },
};

export const GET_L1_GOVERNANCE_SIGNALS_BY_PAYLOAD = asyncHandler(async (req, res) => {
  const parsed = getGovernanceSignalsByPayloadSchema.parse(req);
  const signals = await queries.getSignalsByPayload(parsed.params.payloadAddress);
  res.status(200).json(signals);
});

// ── GET /l1/governance/configurations ────────────────────────────────────────

export const openapi_GET_L1_GOVERNANCE_CONFIGURATIONS: OpenAPIObject["paths"] = {
  [paths.governanceConfigurations]: {
    get: {
      tags: ["L1", "governance"],
      summary: "List historical governance configurations",
      parameters: [
        {
          name: "offset",
          in: "query",
          schema: { type: "integer", default: 0 },
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 20, maximum: 100 },
        },
      ],
      responses: { "200": { description: "List of configurations" } },
    },
  },
};

export const GET_L1_GOVERNANCE_CONFIGURATIONS = asyncHandler(async (req, res) => {
  const parsed = getGovernanceConfigurationsSchema.parse(req);
  const configs = await queries.getConfigurations(parsed.query);
  res.status(200).json(configs);
});

// ── GET /l1/governance/proposer-history ──────────────────────────────────────

export const openapi_GET_L1_GOVERNANCE_PROPOSER_HISTORY: OpenAPIObject["paths"] = {
  [paths.governanceProposerHistory]: {
    get: {
      tags: ["L1", "governance"],
      summary: "List governance proposer change history",
      parameters: [
        {
          name: "offset",
          in: "query",
          schema: { type: "integer", default: 0 },
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 20, maximum: 100 },
        },
      ],
      responses: { "200": { description: "List of proposer history entries" } },
    },
  },
};

export const GET_L1_GOVERNANCE_PROPOSER_HISTORY = asyncHandler(async (req, res) => {
  const parsed = getGovernanceProposerHistorySchema.parse(req);
  const history = await queries.getProposerHistory(parsed.query);
  res.status(200).json(history);
});
