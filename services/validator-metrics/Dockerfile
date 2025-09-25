ARG BASE

FROM $BASE as BUILD
WORKDIR /usr/main/services/validator-metrics

# Add VERSION_STRING as build arg
ARG VERSION_STRING
ENV VERSION_STRING $VERSION_STRING

RUN yarn workspaces focus @chicmoz/validator-metrics
COPY . .
RUN yarn build

FROM node:20-alpine
WORKDIR /usr/main/services/validator-metrics

# Pass VERSION_STRING to the runtime environment
ARG VERSION_STRING
ENV VERSION_STRING $VERSION_STRING

COPY --from=BUILD /usr/main /usr/main

CMD ["yarn", "run", "start"]
