import { EventHandler } from "@chicmoz-pkg/message-bus";
import {
  generateL1TopicName,
  getConsumerGroupId,
} from "@chicmoz-pkg/message-registry";
import { type ChicmozChainInfo, getL1NetworkId } from "@chicmoz-pkg/types";
import { SERVICE_NAME } from "../../constants.js";
import { L2_NETWORK_ID } from "../../environment.js";
import { logger } from "../../logger.js";
import { l2 } from "../../svcs/database/controllers/index.js";

type StakingAssetInfoEvent = {
  chainInfo: ChicmozChainInfo & {
    stakingAssetSymbol?: string;
    stakingAssetDecimals?: number;
  };
};

const onStakingAssetInfo = async (event: StakingAssetInfoEvent) => {
  logger.info(
    `🪙 staking asset info event ${event.chainInfo.l1ContractAddresses.stakingAssetAddress} ${event.chainInfo.stakingAssetSymbol}`,
  );
  await l2.storeChainInfo(event.chainInfo);
};

export const stakingAssetInfoHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "stakingAssetInfoHandler",
  }),
  topic: generateL1TopicName(
    L2_NETWORK_ID,
    getL1NetworkId(L2_NETWORK_ID),
    "STAKING_ASSET_INFO_EVENT" as Parameters<typeof generateL1TopicName>[2],
  ),
  cb: onStakingAssetInfo as (arg0: unknown) => Promise<void>,
};
