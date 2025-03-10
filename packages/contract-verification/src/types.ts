import { chicmozL2ContractInstanceVerifiedDeploymentArgumentsSchema } from "@chicmoz-pkg/types";
import { z } from "zod";

export type VerifyArtifactPayload = {
  stringifiedArtifactJson: string;
};
export type IsTokenArtifactResult = {
  result: boolean;
  contractName: string;
  details: string;
};

export const verifyInstanceDeploymentPayloadSchema = z.lazy(() =>
  z.object({
    ...chicmozL2ContractInstanceVerifiedDeploymentArgumentsSchema.omit({
      id: true,
      address: true,
    }).shape,
    stringifiedArtifactJson: z.string().optional(),
  }),
);

export type VerifyInstanceDeploymentPayload = z.infer<
  typeof verifyInstanceDeploymentPayloadSchema
>;
