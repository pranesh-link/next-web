FROM node:22-alpine AS base
WORKDIR /app/api

# Install deps from api/package.json only — no postinstall, no prisma
COPY api/package.json ./
RUN npm install

# Copy api source and config
COPY api/src/ ./src/
COPY api/tsconfig.json ./

# Overwrite shared/schema.ts with the actual db/schema.ts
# This makes the Fastify server fully self-contained (no re-export paths needed)
COPY db/schema.ts ./src/shared/schema.ts

# Build TypeScript — rootDir=./src, outDir=./dist
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/api/dist ./dist
COPY --from=base /app/api/node_modules ./node_modules

EXPOSE 8080
CMD ["node", "dist/index.js"]
