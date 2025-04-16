/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as TermsAndConditionsImport } from './routes/terms-and-conditions'

// Create Virtual Routes

const VerifiedContractInstancesLazyImport = createFileRoute(
  '/verified-contract-instances',
)()
const PrivacyPolicyLazyImport = createFileRoute('/privacy-policy')()
const FeeRecipientsLazyImport = createFileRoute('/fee-recipients')()
const DevLazyImport = createFileRoute('/dev')()
const AztecscanHealthLazyImport = createFileRoute('/aztecscan-health')()
const AboutUsLazyImport = createFileRoute('/about-us')()
const IndexLazyImport = createFileRoute('/')()
const ValidatorsIndexLazyImport = createFileRoute('/validators/')()
const TxEffectsIndexLazyImport = createFileRoute('/tx-effects/')()
const ContractsIndexLazyImport = createFileRoute('/contracts/')()
const BlocksIndexLazyImport = createFileRoute('/blocks/')()
const ValidatorsAttesterAddressLazyImport = createFileRoute(
  '/validators/$attesterAddress',
)()
const TxEffectsHashLazyImport = createFileRoute('/tx-effects/$hash')()
const L1ContractEventsLazyImport = createFileRoute('/l1/contract-events')()
const BlocksBlockNumberLazyImport = createFileRoute('/blocks/$blockNumber')()
const ContractsInstancesAddressLazyImport = createFileRoute(
  '/contracts/instances/$address',
)()
const ContractsClassesIdVersionsVersionLazyImport = createFileRoute(
  '/contracts/classes/$id/versions/$version',
)()

// Create/Update Routes

const VerifiedContractInstancesLazyRoute =
  VerifiedContractInstancesLazyImport.update({
    path: '/verified-contract-instances',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import('./routes/verified-contract-instances.lazy').then((d) => d.Route),
  )

const PrivacyPolicyLazyRoute = PrivacyPolicyLazyImport.update({
  path: '/privacy-policy',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/privacy-policy.lazy').then((d) => d.Route),
)

const FeeRecipientsLazyRoute = FeeRecipientsLazyImport.update({
  path: '/fee-recipients',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/fee-recipients.lazy').then((d) => d.Route),
)

const DevLazyRoute = DevLazyImport.update({
  path: '/dev',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/dev.lazy').then((d) => d.Route))

const AztecscanHealthLazyRoute = AztecscanHealthLazyImport.update({
  path: '/aztecscan-health',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/aztecscan-health.lazy').then((d) => d.Route),
)

const AboutUsLazyRoute = AboutUsLazyImport.update({
  path: '/about-us',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/about-us.lazy').then((d) => d.Route))

const TermsAndConditionsRoute = TermsAndConditionsImport.update({
  path: '/terms-and-conditions',
  getParentRoute: () => rootRoute,
} as any)

const IndexLazyRoute = IndexLazyImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/index.lazy').then((d) => d.Route))

const ValidatorsIndexLazyRoute = ValidatorsIndexLazyImport.update({
  path: '/validators/',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/validators/index.lazy').then((d) => d.Route),
)

const TxEffectsIndexLazyRoute = TxEffectsIndexLazyImport.update({
  path: '/tx-effects/',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/tx-effects/index.lazy').then((d) => d.Route),
)

const ContractsIndexLazyRoute = ContractsIndexLazyImport.update({
  path: '/contracts/',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/contracts/index.lazy').then((d) => d.Route),
)

const BlocksIndexLazyRoute = BlocksIndexLazyImport.update({
  path: '/blocks/',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/blocks/index.lazy').then((d) => d.Route))

const ValidatorsAttesterAddressLazyRoute =
  ValidatorsAttesterAddressLazyImport.update({
    path: '/validators/$attesterAddress',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import('./routes/validators/$attesterAddress.lazy').then((d) => d.Route),
  )

const TxEffectsHashLazyRoute = TxEffectsHashLazyImport.update({
  path: '/tx-effects/$hash',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/tx-effects/$hash.lazy').then((d) => d.Route),
)

const L1ContractEventsLazyRoute = L1ContractEventsLazyImport.update({
  path: '/l1/contract-events',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/l1/contract-events.lazy').then((d) => d.Route),
)

const BlocksBlockNumberLazyRoute = BlocksBlockNumberLazyImport.update({
  path: '/blocks/$blockNumber',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/blocks/$blockNumber.lazy').then((d) => d.Route),
)

const ContractsInstancesAddressLazyRoute =
  ContractsInstancesAddressLazyImport.update({
    path: '/contracts/instances/$address',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import('./routes/contracts/instances.$address.lazy').then((d) => d.Route),
  )

const ContractsClassesIdVersionsVersionLazyRoute =
  ContractsClassesIdVersionsVersionLazyImport.update({
    path: '/contracts/classes/$id/versions/$version',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import('./routes/contracts/classes.$id.versions.$version.lazy').then(
      (d) => d.Route,
    ),
  )

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/terms-and-conditions': {
      id: '/terms-and-conditions'
      path: '/terms-and-conditions'
      fullPath: '/terms-and-conditions'
      preLoaderRoute: typeof TermsAndConditionsImport
      parentRoute: typeof rootRoute
    }
    '/about-us': {
      id: '/about-us'
      path: '/about-us'
      fullPath: '/about-us'
      preLoaderRoute: typeof AboutUsLazyImport
      parentRoute: typeof rootRoute
    }
    '/aztecscan-health': {
      id: '/aztecscan-health'
      path: '/aztecscan-health'
      fullPath: '/aztecscan-health'
      preLoaderRoute: typeof AztecscanHealthLazyImport
      parentRoute: typeof rootRoute
    }
    '/dev': {
      id: '/dev'
      path: '/dev'
      fullPath: '/dev'
      preLoaderRoute: typeof DevLazyImport
      parentRoute: typeof rootRoute
    }
    '/fee-recipients': {
      id: '/fee-recipients'
      path: '/fee-recipients'
      fullPath: '/fee-recipients'
      preLoaderRoute: typeof FeeRecipientsLazyImport
      parentRoute: typeof rootRoute
    }
    '/privacy-policy': {
      id: '/privacy-policy'
      path: '/privacy-policy'
      fullPath: '/privacy-policy'
      preLoaderRoute: typeof PrivacyPolicyLazyImport
      parentRoute: typeof rootRoute
    }
    '/verified-contract-instances': {
      id: '/verified-contract-instances'
      path: '/verified-contract-instances'
      fullPath: '/verified-contract-instances'
      preLoaderRoute: typeof VerifiedContractInstancesLazyImport
      parentRoute: typeof rootRoute
    }
    '/blocks/$blockNumber': {
      id: '/blocks/$blockNumber'
      path: '/blocks/$blockNumber'
      fullPath: '/blocks/$blockNumber'
      preLoaderRoute: typeof BlocksBlockNumberLazyImport
      parentRoute: typeof rootRoute
    }
    '/l1/contract-events': {
      id: '/l1/contract-events'
      path: '/l1/contract-events'
      fullPath: '/l1/contract-events'
      preLoaderRoute: typeof L1ContractEventsLazyImport
      parentRoute: typeof rootRoute
    }
    '/tx-effects/$hash': {
      id: '/tx-effects/$hash'
      path: '/tx-effects/$hash'
      fullPath: '/tx-effects/$hash'
      preLoaderRoute: typeof TxEffectsHashLazyImport
      parentRoute: typeof rootRoute
    }
    '/validators/$attesterAddress': {
      id: '/validators/$attesterAddress'
      path: '/validators/$attesterAddress'
      fullPath: '/validators/$attesterAddress'
      preLoaderRoute: typeof ValidatorsAttesterAddressLazyImport
      parentRoute: typeof rootRoute
    }
    '/blocks/': {
      id: '/blocks/'
      path: '/blocks'
      fullPath: '/blocks'
      preLoaderRoute: typeof BlocksIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/contracts/': {
      id: '/contracts/'
      path: '/contracts'
      fullPath: '/contracts'
      preLoaderRoute: typeof ContractsIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/tx-effects/': {
      id: '/tx-effects/'
      path: '/tx-effects'
      fullPath: '/tx-effects'
      preLoaderRoute: typeof TxEffectsIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/validators/': {
      id: '/validators/'
      path: '/validators'
      fullPath: '/validators'
      preLoaderRoute: typeof ValidatorsIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/contracts/instances/$address': {
      id: '/contracts/instances/$address'
      path: '/contracts/instances/$address'
      fullPath: '/contracts/instances/$address'
      preLoaderRoute: typeof ContractsInstancesAddressLazyImport
      parentRoute: typeof rootRoute
    }
    '/contracts/classes/$id/versions/$version': {
      id: '/contracts/classes/$id/versions/$version'
      path: '/contracts/classes/$id/versions/$version'
      fullPath: '/contracts/classes/$id/versions/$version'
      preLoaderRoute: typeof ContractsClassesIdVersionsVersionLazyImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren({
  IndexLazyRoute,
  TermsAndConditionsRoute,
  AboutUsLazyRoute,
  AztecscanHealthLazyRoute,
  DevLazyRoute,
  FeeRecipientsLazyRoute,
  PrivacyPolicyLazyRoute,
  VerifiedContractInstancesLazyRoute,
  BlocksBlockNumberLazyRoute,
  L1ContractEventsLazyRoute,
  TxEffectsHashLazyRoute,
  ValidatorsAttesterAddressLazyRoute,
  BlocksIndexLazyRoute,
  ContractsIndexLazyRoute,
  TxEffectsIndexLazyRoute,
  ValidatorsIndexLazyRoute,
  ContractsInstancesAddressLazyRoute,
  ContractsClassesIdVersionsVersionLazyRoute,
})

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/terms-and-conditions",
        "/about-us",
        "/aztecscan-health",
        "/dev",
        "/fee-recipients",
        "/privacy-policy",
        "/verified-contract-instances",
        "/blocks/$blockNumber",
        "/l1/contract-events",
        "/tx-effects/$hash",
        "/validators/$attesterAddress",
        "/blocks/",
        "/contracts/",
        "/tx-effects/",
        "/validators/",
        "/contracts/instances/$address",
        "/contracts/classes/$id/versions/$version"
      ]
    },
    "/": {
      "filePath": "index.lazy.tsx"
    },
    "/terms-and-conditions": {
      "filePath": "terms-and-conditions.tsx"
    },
    "/about-us": {
      "filePath": "about-us.lazy.tsx"
    },
    "/aztecscan-health": {
      "filePath": "aztecscan-health.lazy.tsx"
    },
    "/dev": {
      "filePath": "dev.lazy.tsx"
    },
    "/fee-recipients": {
      "filePath": "fee-recipients.lazy.tsx"
    },
    "/privacy-policy": {
      "filePath": "privacy-policy.lazy.tsx"
    },
    "/verified-contract-instances": {
      "filePath": "verified-contract-instances.lazy.tsx"
    },
    "/blocks/$blockNumber": {
      "filePath": "blocks/$blockNumber.lazy.tsx"
    },
    "/l1/contract-events": {
      "filePath": "l1/contract-events.lazy.tsx"
    },
    "/tx-effects/$hash": {
      "filePath": "tx-effects/$hash.lazy.tsx"
    },
    "/validators/$attesterAddress": {
      "filePath": "validators/$attesterAddress.lazy.tsx"
    },
    "/blocks/": {
      "filePath": "blocks/index.lazy.tsx"
    },
    "/contracts/": {
      "filePath": "contracts/index.lazy.tsx"
    },
    "/tx-effects/": {
      "filePath": "tx-effects/index.lazy.tsx"
    },
    "/validators/": {
      "filePath": "validators/index.lazy.tsx"
    },
    "/contracts/instances/$address": {
      "filePath": "contracts/instances.$address.lazy.tsx"
    },
    "/contracts/classes/$id/versions/$version": {
      "filePath": "contracts/classes.$id.versions.$version.lazy.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
