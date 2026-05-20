DELETE FROM "l2_contract_instance_verified_deployment_arguments" AS duplicate
USING "l2_contract_instance_verified_deployment_arguments" AS canonical
WHERE duplicate."address" = canonical."address"
  AND duplicate."id" > canonical."id";

ALTER TABLE "l2_contract_instance_verified_deployment_arguments"
  ADD CONSTRAINT "verified_deployment_arguments_address_unique" UNIQUE ("address");
