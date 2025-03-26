import { ChicmozChainInfo, chicmozChainInfoSchema, ChicmozL2BlockLight, chicmozL2BlockLightSchema, ChicmozL2RpcNodeError, chicmozL2RpcNodeErrorSchema, ChicmozL2TxEffectDeluxe, chicmozL2TxEffectDeluxeSchema, chicmozSearchQuerySchema, ChicmozSearchResults, chicmozSearchResultsSchema } from "@chicmoz-pkg/types";
import client, { validateResponse } from "./client.js";
import { ENDPOINTS } from "./config.js";
import { z } from "zod";

export const AztecScanApi = {
  //Latest info
  getLatestBlock: async (): Promise<ChicmozL2BlockLight> => {
    const response = await client.get(ENDPOINTS.getL2LatestBlock);

    return validateResponse(chicmozL2BlockLightSchema, response.data);
  },
  getLatestHeight: async (): Promise<string> => {
    const response = await client.get(ENDPOINTS.getL2LatestHeight);
    return validateResponse(z.string(), response.data);
  },

  // Get by hash
  getTxEffectByHash: async (hash: string): Promise<ChicmozL2TxEffectDeluxe> => {
    const response = await client.get(
      `${ENDPOINTS.getL2TxEffectByHash}/${hash}`,
    );
    return validateResponse(chicmozL2TxEffectDeluxeSchema, response.data);
  },

  // Chain info
  getChainInfo: async (): Promise<ChicmozChainInfo> => {
    const response = await client.get(ENDPOINTS.getL2ChainInfo);
    return validateResponse(chicmozChainInfoSchema, response.data);
  },
  getChainErrors: async (): Promise<ChicmozL2RpcNodeError[]> => {
    const response = await client.get(ENDPOINTS.getL2ChainErrors);
    return validateResponse(
      z.array(chicmozL2RpcNodeErrorSchema),
      response.data
    );
  },

  // Search
  search: async (queryString: string): Promise<ChicmozSearchResults> => {
    const query = chicmozSearchQuerySchema.parse({ q: queryString });
    const response = await client.get(ENDPOINTS.getL2SearchResult, {
      params: query,
    });
    return validateResponse(chicmozSearchResultsSchema, response.data);
  },

};

