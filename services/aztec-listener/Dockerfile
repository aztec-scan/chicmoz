ARG BASE

FROM $BASE as BUILD
WORKDIR /usr/main/services/aztec-listener
RUN yarn workspaces focus @chicmoz/aztec-listener
COPY . .
RUN yarn build

FROM node:22-trixie-slim
WORKDIR /usr/main/services/aztec-listener
COPY --from=BUILD /usr/main /usr/main

CMD ["yarn", "node", "--unhandled-rejections=strict", "--enable-source-maps", "./build/src/index.js"]
