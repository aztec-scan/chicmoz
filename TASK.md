- [x] add API-endpoint
  - [x] route
  - [x] open-api
  - [x] use db-controller and cache with redis
- [x] update frontend to use endpoint
  - [x] several files to get the http-call response to page file
  - [x] update txEffectDetails page to also detect if tx is dropped.
    - [x] if dropped: display banner, like orphan banner that informs user

Files to look at for API-endpoint:

- services/explorer-api/src/svcs/http-server/routes/paths_and_validation.ts
- services/explorer-api/src/svcs/database/controllers/dropped-tx/get-tx.ts
- services/explorer-api/src/svcs/http-server/routes/controllers/txs.ts

files to look at for frontend work:

- services/explorer-ui/src/pages/tx-effect-details/index.tsx
- services/explorer-ui/src/hooks/api/tx-effect.ts (perhaps create separate file?)
- services/explorer-ui/src/api/tx-effect.ts (perhaps create separate file?)
- services/explorer-ui/src/service/constants.ts
