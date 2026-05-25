FROM node:22-bookworm AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --legacy-peer-deps

COPY . .

RUN npm run build:ssr

FROM node:22-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./

RUN npm ci --omit=dev --legacy-peer-deps

COPY --from=build /app/dist/ecommerce ./dist/ecommerce

EXPOSE 4006

CMD ["node", "dist/ecommerce/server/main.js"]

