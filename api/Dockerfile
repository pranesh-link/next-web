FROM node:22-alpine AS base
WORKDIR /app

# Copy only api/ — fully self-contained, no monorepo root needed
COPY api/package.json ./
COPY api/src/ ./src/
COPY api/tsconfig.json ./

# Copy only the db schema (needed by src/shared/schema.ts re-export)
COPY db/schema.ts ./db/schema.ts
COPY db/index.ts ./db/index.ts

# Install dependencies (api/package.json only — no postinstall)
RUN npm install

# Build
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules

EXPOSE 8080
CMD ["node", "dist/index.js"]
