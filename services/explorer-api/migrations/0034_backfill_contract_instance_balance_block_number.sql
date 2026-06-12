-- Backfill block_number in contract_instance_balance by resolving the
-- source_tx_hash through the tx_effect → body → l2Block chain.
-- Rows that already have a block_number are left untouched.
UPDATE contract_instance_balance cib
SET block_number = lb.height
FROM tx_effect te, body b, "l2Block" lb
WHERE cib.source_tx_hash = te.tx_hash
  AND te.body_id = b.id
  AND b.block_hash = lb.hash
  AND cib.block_number IS NULL;