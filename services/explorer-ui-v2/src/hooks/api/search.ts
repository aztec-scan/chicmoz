import { type ChicmozSearchResults } from "@chicmoz-pkg/types";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { searchL2Api } from "~/api";
import { queryKeyGenerator } from "./utils";

export const useSearch = (
  query: string,
  enabled = false,
): UseQueryResult<ChicmozSearchResults, Error> => {
  return useQuery<ChicmozSearchResults, Error>({
    queryKey: queryKeyGenerator.search(query),
    queryFn: () => searchL2Api.search(query),
    refetchOnWindowFocus: false,
    enabled,
  });
};
