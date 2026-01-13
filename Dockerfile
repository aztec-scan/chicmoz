FROM node:20-alpine

RUN apk update && apk add jq python3 make g++ && rm -rf /var/cache/apk/*

WORKDIR /usr/main

COPY .yarnrc.yml yarn.lock package.json .yarn .yarn/
RUN yarn install

COPY packages packages
COPY services services

RUN find packages -mindepth 2 -maxdepth 2 -type f -name 'package.json' -exec sh -c "jq '.name' {}" \; | xargs yarn workspaces focus
RUN yarn run build:packages
RUN rm -rf .yarn/cache node_modules/.cache
