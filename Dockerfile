# Build and run Angular SSR with a fixed Node version (host server Node is irrelevant).
# Requires Docker only on the server.

FROM node:22-bookworm AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build:ssr

FROM node:22-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist/ecommerce ./dist/ecommerce

# Matches src/environments/environment.prod.ts port (map host: -p 80:4006)
EXPOSE 4006

CMD ["node", "dist/ecommerce/server/main.js"]
