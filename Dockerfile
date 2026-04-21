FROM node:20-alpine

RUN apk update && apk add jq python3 make g++

WORKDIR /usr/main

RUN yarn install

COPY .yarn .yarn
COPY .yarnrc.yml .yarnrc.yml
COPY package.json package.json
COPY yarn.lock yarn.lock
COPY services services
COPY packages packages

RUN find packages -mindepth 2 -maxdepth 2 -type f -name 'package.json' -exec sh -c "jq '.name' {}" \; | xargs yarn workspaces focus
RUN yarn run build:packages
