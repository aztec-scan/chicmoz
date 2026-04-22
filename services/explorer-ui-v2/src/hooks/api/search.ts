import { type ChicmozSearchResults } from "@chicmoz-pkg/types";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { searchL2Api } from "~/api";

export const useSearch = (
  query: string,
): UseQueryResult<ChicmozSearchResults, Error> => {
  return useQuery<ChicmozSearchResults, Error>({
    queryKey: ["search", query],
    queryFn: () => searchL2Api.search(query),
    refetchOnWindowFocus: false,
    enabled: false,
  });
};
