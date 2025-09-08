// import { getDb as db } from "@chicmoz-pkg/postgres-helper";
// import {
//   ChicmozL2TxEffect,
//   ChicmozSearchQuery,
//   HexString,
//   chicmozL2TxEffectSchema,
//   chicmozSearchResultsSchema,
//   type ChicmozSearchResults,
// } from "@chicmoz-pkg/types";
// import { eq, sql } from "drizzle-orm";
// import { z } from "zod";
// import { l1L2ValidatorTable } from "../../schema/l1/l2-validator.js";

// const matchValidator = async (
//   hash: HexString,
// ): Promise<ChicmozSearchResults["results"]["validators"]> => {
//   const res = await db()
//     .select({
//       attester: l1L2ValidatorTable.attester,
//     })
//     .from(l1L2ValidatorTable)
//     .where(eq(l1L2ValidatorTable.attester, hash))
//     .execute();
//   if (res.length === 0) {
//     return [];
//   }
//   return [{ validatorAddress: res[0].attester }];
// };

// export const search = async (
//   query: ChicmozSearchQuery["q"],
// ): Promise<ChicmozSearchResults> => {
//   if (typeof query === "bigint") {
//     return {
//       searchPhrase: query.toString(),
//       results: {
//         validators: [],
//       },
//     };
//   }
//   const [
//     validators,
//   ] = await Promise.all([
//     matchValidator(query),
//   ]);

//   return chicmozSearchResultsSchema.parse({
//     searchPhrase: query,
//     results: {
//       validators,
//     },
//   });
// };
