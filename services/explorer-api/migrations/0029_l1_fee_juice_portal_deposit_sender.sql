-- Add l1_sender column to store the L1 address that called depositToAztecPublic.
-- Nullable so existing rows remain valid.
ALTER TABLE "l1_fee_juice_portal_deposit" ADD COLUMN "l1_sender" varchar;
