ARG BASE

FROM $BASE as BUILD
WORKDIR /usr/main/services/websocket-event-publisher
RUN yarn workspaces focus @chicmoz/websocket-event-publisher
COPY . .
RUN yarn build

FROM node:20-alpine
RUN apk add --no-cache gcompat libstdc++
WORKDIR /usr/main/services/websocket-event-publisher
COPY --from=BUILD /usr/main /usr/main

CMD ["yarn", "run", "start"]

