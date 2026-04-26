# Stage 1: Build
FROM node:24-alpine AS builder

# Install build tools for native dependencies (better-sqlite3)
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and rebuild native modules for the container architecture
RUN npm ci && npm rebuild better-sqlite3

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ---------------------------------------------------
# Stage 2: Production
FROM node:24-alpine AS production

# Install build tools for native dependencies (needed at runtime for better-sqlite3)
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies and rebuild native modules
RUN npm ci --omit=dev && npm rebuild better-sqlite3

# Copy built application from builder stage (adapter-node usa /build)
COPY --from=builder /app/build ./build

# Copy static assets
COPY static ./static

# Copy necessary config files
COPY drizzle.config.ts ./
COPY vite.config.ts ./

# Copy database scripts
COPY scripts/db ./scripts/db
COPY drizzle ./drizzle

# Copy schema and seed files for drizzle-kit
COPY src/lib/db ./src/lib/db
COPY src/lib/seed ./src/lib/seed
COPY src/lib/utils ./src/lib/utils

# Create data directory
RUN mkdir -p /app/data/prod

# Expose port
EXPOSE 4173

# Set production environment (Variables dinámicas manejadas por docker-compose)
ENV NODE_ENV=production

# Start the Node.js production server
CMD ["node", "build/index.js"]
