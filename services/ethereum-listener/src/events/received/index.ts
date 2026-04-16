import { EventHandler } from "@chicmoz-pkg/message-bus";
import {
  ChicmozChainInfoEvent,
  generateL2TopicName,
} from "@chicmoz-pkg/message-registry";
import { type ChicmozChainInfo } from "@chicmoz-pkg/types";
import { getPublicHttpClient } from "../../network-client/client/index.js";
import { SERVICE_NAME } from "../../constants.js";
import { L2_NETWORK_ID } from "../../environment.js";
import { emit } from "../index.js";
import { logger } from "../../logger.js";
import { storeL1ContractAddresses } from "../../svcs/database/controllers/index.js";
import { ensureStarted } from "../../svcs/events-watcher/index.js";
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

const publishStakingAssetInfo = async (
  chainInfo: ChicmozChainInfo,
): Promise<void> => {
  const stakingAssetAddress = chainInfo.l1ContractAddresses
    .stakingAssetAddress as `0x${string}`;
  const [stakingAssetSymbol, stakingAssetDecimals] = await Promise.all([
    getPublicHttpClient().readContract({
      address: stakingAssetAddress,
      abi: erc20MetadataAbi,
      functionName: "symbol",
    }),
    getPublicHttpClient().readContract({
      address: stakingAssetAddress,
      abi: erc20MetadataAbi,
      functionName: "decimals",
    }),
  ]);

  await emit.stakingAssetInfo({
    chainInfo: {
      ...chainInfo,
      stakingAssetSymbol,
      stakingAssetDecimals,
    },
  });
};

export const onChainInfo = async (event: ChicmozChainInfoEvent) => {
  logger.info(`🔗 chain info event ${JSON.stringify(event)}`);
  await storeL1ContractAddresses(event.chainInfo.l1ContractAddresses);
  await publishStakingAssetInfo(event.chainInfo);
  await ensureStarted();
};

export const connectedToAztec: EventHandler = {
  groupId: `${groupId}-connected-to-aztec`,
  cb: onChainInfo as (arg0: unknown) => Promise<void>,
  topic: generateL2TopicName(L2_NETWORK_ID, "CHAIN_INFO_EVENT"),
};
