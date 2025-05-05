import { type ChicmozL2DroppedTx } from "@chicmoz-pkg/types";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { DroppedTxAPI } from "~/api/dropped-tx";
import { queryKeyGenerator } from "./utils";

export const useGetDroppedTxByHash = (
  hash: string
): UseQueryResult<ChicmozL2DroppedTx | null, Error> => {
  return useQuery<ChicmozL2DroppedTx | null, Error>({
    queryKey: queryKeyGenerator.droppedTxByHash(hash),
    queryFn: () => DroppedTxAPI.getDroppedTxByHash(hash),
  });
};
