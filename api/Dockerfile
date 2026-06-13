FROM node:22-alpine AS base
WORKDIR /app

# Copy monorepo structure needed for build
COPY package.json yarn.lock ./
COPY api/package.json ./api/
COPY db/ ./db/
COPY app/_services/ ./app/_services/
COPY app/_lib/ ./app/_lib/

# Install API dependencies (includes devDeps for tsc build)
RUN cd api && npm install

# Copy API source + shared config
COPY api/src/ ./api/src/
COPY api/tsconfig.json ./api/

# Build TypeScript — rootDir is /app so db/ and app/ are in scope
RUN cd api && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/api/dist ./api/dist
COPY --from=base /app/api/node_modules ./node_modules
COPY --from=base /app/db ./db
COPY --from=base /app/app/_services ./app/_services
COPY --from=base /app/app/_lib ./app/_lib

EXPOSE 8080
# With rootDir="..", tsc outputs api/src/index.ts → dist/api/src/index.js
CMD ["node", "api/dist/api/src/index.js"]
