import { MicroserviceBaseSvc } from "@chicmoz-pkg/microservice-base";
import { getL1NetworkId } from "@chicmoz-pkg/types";
import {
  ETHEREUM_ALCHEMY_HTTP_URL,
  ETHEREUM_HTTP_RPC_URL,
  ETHEREUM_WS_RPC_URL,
  L2_NETWORK_ID,
} from "../../environment.js";
import { logger } from "../../logger.js";
import { init } from "../../network-client/index.js";

export const ethereumNetworkClientService: MicroserviceBaseSvc = {
  svcId: "EthereuemNetworkClient",
  health: () => true,
  init,
  // eslint-disable-next-line @typescript-eslint/require-await
  shutdown: async () => {
    logger.warn("ETH: shutdown nothing to shutdown!");
  },
  getConfigStr: () =>
    `Ethereum Network Client
ETHEREUM_HTTP_RPC_URL:      ${ETHEREUM_HTTP_RPC_URL}
ETHEREUM_WS_RPC_URL:        ${ETHEREUM_WS_RPC_URL}
ETHEREUM_ALCHEMY_HTTP_URL:  ${ETHEREUM_ALCHEMY_HTTP_URL}
L1_ID:                      ${getL1NetworkId(L2_NETWORK_ID)}`,
};
