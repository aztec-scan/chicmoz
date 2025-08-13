import asyncHandler from "express-async-handler";
import { controllers as db } from "../../../database/index.js";
import { dbWrapper } from "./utils/index.js";
import { getContractClassIdSchema } from "../paths_and_validation.js";

export const GET_STATS_TOTAL_TX_EFFECTS = asyncHandler(async (_req, res) => {
  const total = await dbWrapper.getLatest(["stats", "totalTxEffects"], () =>
    db.l2TxEffect.getTotalTxEffects(),
  );
  res.status(200).json(JSON.parse(total));
});

export const GET_STATS_TOTAL_TX_EFFECTS_LAST_24H = asyncHandler(
  async (_req, res) => {
    const nbrOfTxEffects = await dbWrapper.getLatest(
      ["stats", "totalTxEffectsLast24h"],
      () => db.l2TxEffect.getTotalTxEffectsLast24h(),
    );
    res.status(200).json(JSON.parse(nbrOfTxEffects));
  },
);

export const GET_STATS_TOTAL_CONTRACTS = asyncHandler(async (_req, res) => {
  const total = await dbWrapper.getLatest(["stats", "totalContracts"], () =>
    db.l2Contract.getTotalContracts(),
  );
  res.status(200).json(JSON.parse(total));
});

export const GET_STATS_TOTAL_CONTRACT_INSTANCES = asyncHandler(async (_req, res) => {
  const total = await dbWrapper.getLatest(["stats", "totalContractInstances"], () =>
    db.l2Contract.getL2TotalAmountDeployedContractInstances(),
  );
  res.status(200).json(JSON.parse(total));
});

export const GET_STATS_TOTAL_CONTRACTS_LAST_24H = asyncHandler(
  async (_req, res) => {
    const total = await dbWrapper.getLatest(
      ["stats", "totalContractsLast24h"],
      () => db.l2Contract.getTotalContractsLast24h(),
    );
    res.status(200).json(JSON.parse(total));
  },
);

export const GET_STATS_AVERAGE_FEES = asyncHandler(async (_req, res) => {
  const average = await dbWrapper.getLatest(["stats", "averageFees"], () =>
    db.l2Block.getAverageFees(),
  );
  res.status(200).json(JSON.parse(average));
});

export const GET_STATS_AVERAGE_BLOCK_TIME = asyncHandler(async (_req, res) => {
  const average = await dbWrapper.getLatest(["stats", "averageBlockTime"], () =>
    db.l2Block.getAverageBlockTime(),
  );
  res.status(200).json(JSON.parse(average));
});

export const GET_STATS_TOTAL_CONTRACT_INSTANCES_BY_CONTRACT_CLASS_ID =
  asyncHandler(async (req, res) => {
    const { contractClassId } = getContractClassIdSchema.parse(req).params;
    const total = await dbWrapper.get(["stats", contractClassId], () =>
      db.l2Contract.getL2TotalAmountDeployedContractInstancesByCurrentContractClassId(
        contractClassId,
      ),
    );
    res.status(200).json(JSON.parse(total));
  });
