# Build from the repo root: docker build -f infra/docker/api.Dockerfile -t valleyride-api .
# The same image runs the API (default) and the worker (command: node dist/worker.js).
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.11.8 prune @valleyride/api --docker

FROM base AS builder
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ .
RUN pnpm turbo run build --filter=@valleyride/api
RUN pnpm --filter @valleyride/api deploy --prod --legacy /app

FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app .
# Keep CLI migrations and their config in the runtime image; tsc does not emit these JS files.
COPY --from=builder /repo/apps/api/.sequelizerc ./.sequelizerc
COPY --from=builder /repo/apps/api/src/config/database.cjs ./src/config/database.cjs
COPY --from=builder /repo/apps/api/src/db/migrations ./src/db/migrations
COPY --from=builder /repo/apps/api/src/db/seeders ./src/db/seeders
COPY --from=builder /repo/apps/api/src/db/content ./src/db/content
COPY --from=builder /repo/apps/api/public ./public
# Private uploads; production mounts a named volume here, which Docker seeds with this owner.
RUN mkdir -p /app/.uploads && chown node:node /app/.uploads
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=10s CMD wget -qO- http://127.0.0.1:4000/ready || exit 1
CMD ["node", "dist/server.js"]
