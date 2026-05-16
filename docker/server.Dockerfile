FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable
RUN corepack prepare pnpm@9.15.9 --activate
RUN echo "ignore-build-scripts=false" > /app/.npmrc  # на всякий случай

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/package.json

RUN pnpm install --frozen-lockfile --filter @pixel-vpn/server...

COPY apps/server apps/server

RUN pnpm --filter @pixel-vpn/server prisma:generate
RUN pnpm --filter @pixel-vpn/server build

EXPOSE 8787

CMD ["sh", "-c", "pnpm --filter @pixel-vpn/server exec prisma db push --accept-data-loss && pnpm --filter @pixel-vpn/server start"]
