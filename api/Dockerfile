FROM node:22-alpine AS base
WORKDIR /app/api

# Install deps from api/package.json only (no postinstall/prisma)
COPY api/package.json ./
RUN npm install

# Copy api source
COPY api/src/ ./src/
COPY api/tsconfig.json ./

# Overwrite src/shared/schema.ts with the actual monorepo db/schema.ts
# This makes the schema fully self-contained — no cross-boundary re-export
COPY db/schema.ts ./src/shared/schema.ts

# Build
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/api/dist ./dist
COPY --from=base /app/api/node_modules ./node_modules

EXPOSE 8080
CMD ["node", "dist/index.js"]
