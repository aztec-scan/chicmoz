FROM node:20-alpine AS build

RUN apk update && apk add jq python3 make g++

WORKDIR /usr/main

COPY .yarn .yarn
COPY .yarnrc.yml .yarnrc.yml
COPY package.json package.json
COPY yarn.lock yarn.lock
COPY services services
COPY packages packages

ENV SKIP_ENV_VALIDATION true
ENV GENERATE_SOURCEMAP false

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

ARG VITE_L2_NETWORK_ID
ENV VITE_L2_NETWORK_ID $VITE_L2_NETWORK_ID

ARG VITE_CHICMOZ_ALL_UI_URLS
ENV VITE_CHICMOZ_ALL_UI_URLS $VITE_CHICMOZ_ALL_UI_URLS

ARG VITE_API_URL
ENV VITE_API_URL $VITE_API_URL

ARG VITE_API_KEY
ENV VITE_API_KEY $VITE_API_KEY

ARG VITE_WS_URL
ENV VITE_WS_URL $VITE_WS_URL

ARG VITE_DISCORD_URL
ENV VITE_DISCORD_URL $VITE_DISCORD_URL

ARG VITE_GITHUB_URL
ENV VITE_GITHUB_URL $VITE_GITHUB_URL

ARG VITE_X_URL
ENV VITE_X_URL $VITE_X_URL

ARG VITE_VERSION_STRING
ENV VITE_VERSION_STRING $VITE_VERSION_STRING

RUN yarn workspaces focus @chicmoz/explorer-ui
RUN yarn run build:packages

WORKDIR /usr/main/services/explorer-ui
RUN yarn build

FROM nginx:1.21-alpine AS runner

RUN sed -i '/location \//a try_files $uri $uri/ /index.html;' /etc/nginx/conf.d/default.conf
COPY --from=build /usr/main/services/explorer-ui/dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
