FROM node:20-alpine AS build

RUN apk update && apk add jq python3 make g++

WORKDIR /usr/main

COPY .yarn .yarn
COPY .yarnrc.yml .yarnrc.yml
COPY package.json package.json
COPY yarn.lock yarn.lock
COPY services services
COPY packages packages

RUN yarn workspaces focus @chicmoz/ethereum-listener
RUN yarn run build:packages

WORKDIR /usr/main/services/ethereum-listener
RUN yarn build

FROM node:22-trixie-slim
WORKDIR /usr/main/services/ethereum-listener
COPY --from=build /usr/main /usr/main

CMD ["yarn", "run", "start"]
