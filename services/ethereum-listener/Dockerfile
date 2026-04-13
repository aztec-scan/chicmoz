ARG BASE

FROM $BASE as BUILD
WORKDIR /usr/main/services/ethereum-listener
RUN yarn workspaces focus @chicmoz/ethereum-listener
COPY . .
RUN yarn build

FROM node:22-trixie-slim
WORKDIR /usr/main/services/ethereum-listener
COPY --from=BUILD /usr/main /usr/main

CMD ["yarn", "run", "start"]

