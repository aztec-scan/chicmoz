ARG BASE

FROM $BASE as BUILD
WORKDIR /usr/main/services/event-cannon
RUN yarn workspaces focus @chicmoz/event-cannon
COPY . .
RUN yarn build

FROM node:22-trixie-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends libstdc++6 \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /usr/main/services/event-cannon
COPY --from=BUILD /usr/main /usr/main

CMD ["yarn", "run", "start"]

