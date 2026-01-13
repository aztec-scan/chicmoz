ARG BASE

FROM $BASE as BUILD
WORKDIR /usr/main/services/explorer-api

ARG VERSION_STRING
ENV VERSION_STRING $VERSION_STRING

RUN yarn workspaces focus @chicmoz/explorer-api
COPY . .
RUN yarn build && \
  rm -rf node_modules/.cache .yarn/cache

FROM node:20-alpine
WORKDIR /usr/main/services/explorer-api

ARG VERSION_STRING
ENV VERSION_STRING $VERSION_STRING

COPY --from=BUILD /usr/main /usr/main

CMD ["yarn", "run", "start"]
