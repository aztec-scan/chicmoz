# Build stage
FROM node:22-alpine AS builder

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV

ARG VITE_L2_NETWORK_ID
ENV VITE_L2_NETWORK_ID=$VITE_L2_NETWORK_ID

ARG VITE_CHICMOZ_ALL_UI_URLS
ENV VITE_CHICMOZ_ALL_UI_URLS=$VITE_CHICMOZ_ALL_UI_URLS

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_API_KEY
ENV VITE_API_KEY=$VITE_API_KEY

ARG VITE_WS_URL
ENV VITE_WS_URL=$VITE_WS_URL

ARG VITE_DISCORD_URL
ENV VITE_DISCORD_URL=$VITE_DISCORD_URL

ARG VITE_GITHUB_URL
ENV VITE_GITHUB_URL=$VITE_GITHUB_URL

ARG VITE_X_URL
ENV VITE_X_URL=$VITE_X_URL

ARG VITE_VERSION_STRING
ENV VITE_VERSION_STRING=$VITE_VERSION_STRING

# Enable Corepack for Yarn 4 support
RUN corepack enable

WORKDIR /app

# Copy monorepo root package files (yarn.lock and .yarnrc.yml live at repo root)
COPY package.json yarn.lock .yarnrc.yml ./

# Copy workspace packages needed by the frontend
COPY packages/ ./packages/
COPY services/explorer-ui-v2/ ./services/explorer-ui-v2/

# Install only the deps needed for this workspace
RUN yarn workspaces focus @chicmoz/explorer-ui-v2

# Build the frontend workspace
RUN yarn workspace @chicmoz/explorer-ui-v2 build

# Production stage - serve with nginx
FROM nginx:alpine AS production

# Copy built assets from builder
COPY --from=builder /app/services/explorer-ui-v2/dist /usr/share/nginx/html

# SPA routing — serve index.html for all unmatched paths
RUN sed -i '/location \//a try_files $uri $uri/ /index.html;' /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
