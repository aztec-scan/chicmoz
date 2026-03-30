ARG BASE

FROM $BASE as BUILD
WORKDIR /usr/main/services/auth
RUN yarn workspaces focus @chicmoz/auth
COPY . .
RUN yarn build

FROM node:22-trixie-slim
WORKDIR /usr/main/services/auth
COPY --from=BUILD /usr/main /usr/main

CMD ["yarn", "run", "start"]