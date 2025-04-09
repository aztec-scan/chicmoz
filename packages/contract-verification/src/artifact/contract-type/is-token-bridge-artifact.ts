/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { NoirCompiledContract } from "@aztec/aztec.js";
import { z } from "zod";
import { ContractTypeParsingResult } from "../../types.js";

const getConfig = "get_config";
const exitToL1Public = "exit_to_l1_public";
const publicDispatch = "public_dispatch";
const getConfigPublic = "get_config_public";
const constructor = "constructor";
const claimPublic = "claim_public";
const claimPrivate = "claim_private";
const exitToL1Private = "exit_to_l1_private";
const syncNote = "sync_notes";

const requiredFunctionNames = [
  getConfig,
  exitToL1Public,
  publicDispatch,
  getConfigPublic,
  constructor,
  claimPublic,
  claimPrivate,
  exitToL1Private,
  syncNote,
];

const anyFunction = z.object({
  name: z.string(),
  custom_attributes: z.array(z.string()),
});

const getConfigSchema = z.object({
  name: z.string().regex(new RegExp(`^${getConfig}$`)),
  custom_attributes: z.array(z.string()),
});

const exitToL1PublicSchema = z.object({
  name: z.string().regex(new RegExp(`^${exitToL1Public}$`)),
  custom_attributes: z.array(z.string()),
});

const publicDispatchSchema = z.object({
  name: z.string().regex(new RegExp(`^${publicDispatch}$`)),
  custom_attributes: z.array(z.string()),
});

const getConfigPublicSchema = z.object({
  name: z.string().regex(new RegExp(`^${getConfigPublic}$`)),
  custom_attributes: z.array(z.string()),
});

const constructorSchema = z.object({
  name: z.string().regex(new RegExp(`^${constructor}$`)),
  custom_attributes: z.array(z.string()),
});

const claimPublicSchema = z.object({
  name: z.string().regex(new RegExp(`^${claimPublic}$`)),
  custom_attributes: z.array(z.string()),
});

const claimPrivateSchema = z.object({
  name: z.string().regex(new RegExp(`^${claimPrivate}$`)),
  custom_attributes: z.array(z.string()),
});

const exitToL1PrivateSchema = z.object({
  name: z.string().regex(new RegExp(`^${exitToL1Private}$`)),
  custom_attributes: z.array(z.string()),
});

const syncNoteSchema = z.object({
  name: z.string().regex(new RegExp(`^${syncNote}$`)),
  custom_attributes: z.array(z.string()),
});

const requiredFunctions = z.union([
  getConfigSchema,
  exitToL1PublicSchema,
  publicDispatchSchema,
  getConfigPublicSchema,
  constructorSchema,
  claimPublicSchema,
  claimPrivateSchema,
  exitToL1PrivateSchema,
  syncNoteSchema,
]);

const tokenBridgeSchema = z.object({
  name: z.string(),
  functions: z
    .array(requiredFunctions.or(anyFunction))
    .superRefine(
      (
        value: Array<Record<string, string | string[]>>,
        ctx: z.RefinementCtx,
      ) => {
        // TODO: shared logic with is-token-artifact.ts
        const functionNames = value.map((f) => f.name);
        const missingFunctions = requiredFunctionNames.filter(
          (fn) => !functionNames.includes(fn),
        );
        if (missingFunctions.length !== 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Missing functions: ${missingFunctions.join(", ")}`,
          });
        }
      },
    ),
});

const customErrorMap: z.ZodErrorMap = (_error, ctx: z.ErrorMapCtx) => {
  if (ctx?.data?.toString()?.length < 100) {
    return { message: `${ctx.defaultError} (with data: ${ctx.data})` };
  }
  return { message: ctx.defaultError };
};

export const isTokenBridgeArtifact = (
  artifact: NoirCompiledContract,
): ContractTypeParsingResult => {
  let details = "";
  let contractName = "";
  try {
    const { name } = tokenBridgeSchema.parse(artifact, {
      errorMap: customErrorMap,
    });
    contractName = name;
  } catch (err) {
    if (err instanceof z.ZodError) {
      details = err.errors.map((e) => JSON.stringify(e)).join("\n");
    } else {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }
  return {
    result: details === "",
    contractName,
    details,
  };
};
