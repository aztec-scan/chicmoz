# Implement Trusted Token Portals - TODO

## Overview

This feature adds support for identifying and displaying commonly used (trusted) token portals to users. This helps users easily identify which token portals they can safely use with trust indicators.

## Task List

### Types & Schema Updates

- [x] Update `packages/types/src/aztec/l2Contract.ts` with `ContractType` enum and schema
- [x] Add `contractTypeSchema` and validation for contract types
- [x] Add `contract_type` column to the `l2_contract_class_registered` table
- [x] Create new `l2_contract_instance_aztec_scan_notes` table with fields for origin, comment, and related L1 addresses
- [x] Set up proper database relations for aztecScanNotes

### Backend Implementation

- [x] Update `getL2DeployedContractInstanceByAddress` to include aztecScanNotes
- [x] Implement `updateContractInstanceAztecScanNotes` to store Aztec scan notes
- [x] Replace `isTokenArtifact` with `getContractType` for determining contract types
- [x] Update API validation to respect production environment settings
- [x] Modify `POST_L2_VERIFY_CONTRACT_INSTANCE_DEPLOYMENT` to handle aztecScanNotes
- [ ] Create dedicated API endpoint `/l2/contract-instances/trusted-token-portals` to fetch trusted token portals
- [ ] Add corresponding route and validation in `paths_and_validation.ts`

### Event Cannon Updates

- [ ] Modify `services/event-cannon/src/cannon/scenarios/deploy-and-interact-token-contract.ts` to properly set contract type
- [ ] Create token bridge deployment scenario that sets `ContractType.TokenBridge` and appropriate `aztecScanOriginNotes`
- [ ] Include related L1 contract addresses in token bridge deployment metadata

### Frontend Implementation

- [x] Add UI components to display trust indicators in contract tables
- [x] Implement support for showing AztecScan notes in contract details
- [ ] Add method to `services/explorer-ui/src/api/contract.ts` to fetch trusted token portals
- [ ] Create dedicated page for displaying trusted token portals
- [ ] Enhance existing contract display components to show trust indicators
- [ ] Add navigation link for the trusted portals page

### Network Configuration

- [ ] Implement configuration for trusted portals by network
- [ ] Create structure for hardcoded trusted portal addresses that can be modified via PRs
- [ ] Add configuration files for different environments (development, testnet, mainnet)

### Testing

- [ ] Test event-cannon deployment of token bridges
- [ ] Verify trust indicators display correctly in UI
- [ ] Test the trusted token portals page
- [ ] Verify functionality across different networks

## Notes

- The production environment will initially use hardcoded trusted portals
- Trust status editing is restricted in production mode through validation
- Consider adding an admin interface for managing trusted portals in the future
