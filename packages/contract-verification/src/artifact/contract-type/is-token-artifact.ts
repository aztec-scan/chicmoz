/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { NoirCompiledContract } from "@aztec/aztec.js";
import { ContractTypeParsingResult } from "../../types.js";
import { z } from "zod";

const transferToPrivateStr = "transfer_to_private";
const transferToPublicStr = "transfer_to_public";
const transferInPrivateStr = "transfer_in_private";
const transferInPublicStr = "transfer_in_public";

const requiredFunctionNames = [
  transferToPrivateStr,
  transferToPublicStr,
  transferInPrivateStr,
  transferInPublicStr,
];

const privateSchema = z.string().regex(/private/);
const publicSchema = z.string().regex(/public/);
const anyFunction = z.object({
  name: z.string(),
  custom_attributes: z.array(z.string()),
});
const transferToPrivate = z.object({
  name: z.string().regex(new RegExp(`^${transferToPrivateStr}$`)),
  custom_attributes: z.array(privateSchema),
});
const transferToPublic = z.object({
  name: z.string().regex(new RegExp(`^${transferToPublicStr}$`)),
  custom_attributes: z.array(privateSchema),
});
const transferInPrivate = z.object({
  name: z.string().regex(new RegExp(`^${transferInPrivateStr}$`)),
  custom_attributes: z.array(privateSchema),
});
const transferInPublic = z.object({
  name: z.string().regex(new RegExp(`^${transferInPublicStr}$`)),
  custom_attributes: z.array(publicSchema),
});

const requiredFunctions = z.union([
  transferToPrivate,
  transferToPublic,
  transferInPrivate,
  transferInPublic,
]);

const tokenSchema = z.object({
  name: z.string(),
  functions: z
    .array(requiredFunctions.or(anyFunction))
    .superRefine(
      (
        value: Array<Record<string, string | string[]>>,
        ctx: z.RefinementCtx
      ) => {
        const functionNames = value.map((f) => f.name);
        const missingFunctions = requiredFunctionNames.filter(
          (fn) => !functionNames.includes(fn)
        );
        if (missingFunctions.length !== 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Missing functions: ${missingFunctions.join(", ")}`,
          });
        }
      }
    ),
});
const customErrorMap: z.ZodErrorMap = (_error, ctx: z.ErrorMapCtx) => {
  if (ctx?.data?.toString()?.length < 100) {
    return { message: `${ctx.defaultError} (with data: ${ctx.data})` };
  }
  return { message: ctx.defaultError };
};

export const isTokenArtifact = (
  artifact: NoirCompiledContract
): ContractTypeParsingResult => {
  let details = "";
  let contractName = "";
  try {
    const { name } = tokenSchema.parse(artifact, { errorMap: customErrorMap });
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
