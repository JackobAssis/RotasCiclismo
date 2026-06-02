FROM node:20-slim AS builder

RUN npm install -g pnpm@9

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY apps/api/ apps/api/
COPY packages/ packages/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @cycling/api exec prisma generate
RUN pnpm --filter @cycling/api build

FROM node:20-slim

RUN npm install -g pnpm@9
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/ apps/api/
COPY packages/ packages/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/prisma apps/api/prisma

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node apps/api/dist/main.js"]
