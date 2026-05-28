import { EventHandler } from "@chicmoz-pkg/message-bus";
import {
  ChicmozChainInfoEvent,
  generateL2TopicName,
} from "@chicmoz-pkg/message-registry";
import { type ChicmozChainInfo } from "@chicmoz-pkg/types";
import { isAddress } from "viem";
import { getPublicHttpClient } from "../../network-client/client/index.js";
import { SERVICE_NAME } from "../../constants.js";
import { L2_NETWORK_ID } from "../../environment.js";
import { emit } from "../index.js";
import { logger } from "../../logger.js";
import { storeL1ContractAddresses } from "../../svcs/database/controllers/index.js";
import { ensureStarted } from "../../svcs/events-watcher/index.js";
export { governanceUriRequestHandler } from "./on-governance-uri-request.js";

const groupId = `${SERVICE_NAME}-${L2_NETWORK_ID}`;

const erc20MetadataAbi = [
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

type TokenMetadata = {
  symbol?: string;
  decimals?: number;
};

const getTokenMetadata = async ({
  address,
  tokenName,
}: {
  address: string;
  tokenName: string;
}): Promise<TokenMetadata> => {
  if (!address || !isAddress(address)) {
    logger.warn(
      `Skipping ${tokenName} metadata publish due to invalid address: ${address}`,
    );
    return {};
  }

  try {
    const [symbol, decimals] = await Promise.all([
      getPublicHttpClient().readContract({
        address: address,
        abi: erc20MetadataAbi,
        functionName: "symbol",
      }),
      getPublicHttpClient().readContract({
        address: address,
        abi: erc20MetadataAbi,
        functionName: "decimals",
      }),
    ]);

    if (decimals > 255) {
      throw new Error(
        `Invalid ${tokenName} decimals for ${address}: ${decimals}`,
      );
    }

    return {
      symbol,
      decimals: Number(decimals),
    };
  } catch (error) {
    logger.error(
      `Failed to fetch ${tokenName} metadata for ${address}: ${(error as Error).stack}`,
    );
    return {};
  }
};

const publishChainInfoTokenMetadata = async (
  chainInfo: ChicmozChainInfo,
): Promise<void> => {
  const { stakingAssetAddress, feeJuiceAddress } =
    chainInfo.l1ContractAddresses;

  const [stakingAssetMetadata, feeJuiceMetadata] = await Promise.all([
    getTokenMetadata({
      address: stakingAssetAddress,
      tokenName: "staking asset",
    }),
    getTokenMetadata({
      address: feeJuiceAddress,
      tokenName: "fee juice",
    }),
  ]);

  await emit.stakingAssetInfo({
    chainInfo: {
      ...chainInfo,
      stakingAssetSymbol: stakingAssetMetadata.symbol,
      stakingAssetDecimals: stakingAssetMetadata.decimals,
      feeJuiceSymbol: feeJuiceMetadata.symbol,
      feeJuiceDecimals: feeJuiceMetadata.decimals,
    },
  });
};

export const onChainInfo = async (event: ChicmozChainInfoEvent) => {
  logger.info(`🔗 chain info event ${JSON.stringify(event)}`);
  await storeL1ContractAddresses(event.chainInfo.l1ContractAddresses);

  try {
    await publishChainInfoTokenMetadata(event.chainInfo);
  } catch (e) {
    logger.error(
      `Failed to publish chain info token metadata: ${(e as Error).stack}`,
    );
  }

  await ensureStarted();
};

export const connectedToAztec: EventHandler = {
  groupId: `${groupId}-connected-to-aztec`,
  cb: onChainInfo as (arg0: unknown) => Promise<void>,
  topic: generateL2TopicName(L2_NETWORK_ID, "CHAIN_INFO_EVENT"),
};
