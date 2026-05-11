FROM node:20-alpine AS build

RUN apk update && apk add jq python3 make g++

WORKDIR /usr/main

COPY .yarn .yarn
COPY .yarnrc.yml .yarnrc.yml
COPY package.json package.json
COPY yarn.lock yarn.lock
COPY services services
COPY packages packages

RUN yarn workspaces focus @chicmoz/compiler-orchestrator
RUN yarn run build:packages

WORKDIR /usr/main/services/compiler-orchestrator
RUN yarn build

FROM node:22-trixie-slim
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /usr/main/services/compiler-orchestrator
COPY --from=build /usr/main /usr/main

CMD ["yarn", "node", "--unhandled-rejections=strict", "--enable-source-maps", "./build/src/index.js"]
