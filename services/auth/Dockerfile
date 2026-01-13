ARG BASE

FROM $BASE as BUILD
WORKDIR /usr/main/services/auth
RUN yarn workspaces focus @chicmoz/auth
COPY . .
RUN yarn build && \
  rm -rf node_modules/.cache .yarn/cache

FROM node:20-alpine
WORKDIR /usr/main/services/auth
COPY --from=BUILD /usr/main /usr/main

CMD ["yarn", "run", "start"]
