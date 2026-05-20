import {
  type ChicmozSearchResults,
  chicmozSearchQuerySchema,
  chicmozSearchResultsSchema,
} from "@chicmoz-pkg/types";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

export const searchL2Api = {
  search: async (queryString: string): Promise<ChicmozSearchResults> => {
    const query = chicmozSearchQuerySchema.parse({ q: queryString });
    const response = await client.get(aztecExplorer.getL2SearchResult, {
      params: query,
    });
    return validateResponse(chicmozSearchResultsSchema, response.data);
  },
};
