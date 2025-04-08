import { z } from "zod";
import {
  chicmozL2BlockSchema,
  chicmozL2ContractClassRegisteredEventSchema,
  chicmozL2ContractInstanceDeployedEventSchema,
  chicmozL2TxEffectSchema,
  hexStringSchema,
} from "../index.js";

export const chicmozSearchQuerySchema = z.lazy(() =>
  z.object({
    q: z.preprocess((val: unknown) => {
      if (typeof val === "string") {
        if (val.startsWith("0x")) {
          return val;
        } else if (val.match(/^\d+$/)?.length) {
          return parseInt(val);
        } else {
          return `0x${val}`;
        }
      }
      return val;
    }, hexStringSchema.or(chicmozL2BlockSchema.shape.height)),
  })
);

export const chicmozSearchResultsSchema = z.lazy(() =>
  z.object({
    searchPhrase: z.string(),
    results: z.object({
      blocks: z.array(
        z.object({
          hash: chicmozL2BlockSchema.shape.hash,
        })
      ),
      txEffects: z.array(
        z.object({
          txHash: chicmozL2TxEffectSchema.shape.txHash,
          partOfBlockWithHash: chicmozL2BlockSchema.shape.hash.optional(),
        })
      ),
      registeredContractClasses: z.array(
        z.object({
          contractClassId: chicmozL2ContractClassRegisteredEventSchema.shape.contractClassId,
          version: chicmozL2ContractClassRegisteredEventSchema.shape.version,
          partOfBlockWithHash: chicmozL2BlockSchema.shape.hash.optional(),
        })
      ),
      contractInstances: z.array(
        z.object({
          address: chicmozL2ContractInstanceDeployedEventSchema.shape.address,
          partOfBlockWithHash: chicmozL2BlockSchema.shape.hash.optional(),
        })
      ),
    }),
  })
);

export type ChicmozSearchResults = z.infer<typeof chicmozSearchResultsSchema>;
export type ChicmozSearchQuery = z.infer<typeof chicmozSearchQuerySchema>;
