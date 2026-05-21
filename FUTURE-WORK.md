## Later removal work

Only after production observation and consumer migration:

- Remove legacy public `finalizationStatus` response usage.
- Drop legacy finalization-status DB objects in a dedicated migration.
- Remove any remaining old finalization-status compatibility code.
- Revisit old operator escape hatches once cadenced reconciliation, metrics, alerts, and observation prove the new path is enough:
  - `AZTEC_DISABLE_ETERNAL_CATCHUP`
  - `IGNORE_PROCESSED_HEIGHT`
  - `AZTEC_LISTEN_FOR_PROPOSED_BLOCKS_FORCED_START_FROM_HEIGHT`
  - `AZTEC_LISTEN_FOR_PROVEN_BLOCKS_FORCED_START_FROM_HEIGHT`
