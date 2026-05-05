import { type ChicmozL2DroppedTx } from "@chicmoz-pkg/types";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { DroppedTxAPI } from "~/api";
import { queryKeyGenerator } from "./utils";

export const useDroppedTxByHash = (
  hash: string,
): UseQueryResult<ChicmozL2DroppedTx, Error> => {
  return useQuery<ChicmozL2DroppedTx, Error>({
    queryKey: queryKeyGenerator.droppedTxByHash(hash),
    queryFn: () => DroppedTxAPI.getDroppedTxByHash(hash),
    enabled: !!hash,
    retry: false,
  });
};
