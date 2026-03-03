UPDATE "heights"
SET "eventName" = 'CheckpointProposed'
WHERE "contractName" = 'rollup'
  AND "eventName" = 'L2BlockProposed';
