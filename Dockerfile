# Multi-stage build for SvelteKit app with better-sqlite3
# Uses Node.js 24 LTS

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

# Stage 2: Production
FROM node:24-alpine AS production

# Install build tools for native dependencies (needed at runtime for better-sqlite3)
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies and rebuild native modules
RUN npm ci --omit=dev && npm rebuild better-sqlite3

# Copy built application from builder stage
COPY --from=builder /app/.svelte-kit/output ./.svelte-kit/output

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

# Set production environment and database URL
ENV NODE_ENV=production
ENV DATABASE_URL=./data/prod/local.db

# Start the application (preview the built output)
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "4173"]
