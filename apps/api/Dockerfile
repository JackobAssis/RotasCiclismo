FROM node:20-slim AS builder

RUN npm install -g pnpm@latest

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY apps/api/ apps/api/
COPY packages/ packages/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @cycling/api exec prisma generate
RUN pnpm --filter @cycling/api build

FROM node:20-slim

RUN npm install -g pnpm@latest
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/ apps/api/
COPY packages/ packages/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/prisma apps/api/prisma

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "apps/api/dist/main.js"]
