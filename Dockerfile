# Production SSR image — bundles run inside Docker via `npm run build:ssr` (never rely on implicit defaults).
FROM node:22-bookworm AS build

WORKDIR /app

# Production deps + Angular CLI need devDependencies (@angular/cli, build-angular) until build completes.
ENV NODE_ENV=development

COPY package.json package-lock.json ./

RUN npm ci --legacy-peer-deps

COPY . .

# Large Angular SSR graphs can OOM below ~4 GB inside CI/Docker Desktop.
RUN NODE_OPTIONS="--max-old-space-size=4096" NODE_ENV=production npm run build:ssr

FROM node:22-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./

RUN npm ci --omit=dev --legacy-peer-deps

COPY --from=build /app/dist/ecommerce ./dist/ecommerce

EXPOSE 4006

CMD ["node", "dist/ecommerce/server/main.js"]
