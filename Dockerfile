# ... (Stage 1 se mantiene igual hasta el final) ...

# Stage 2: Production
FROM node:24-alpine AS production

RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm rebuild better-sqlite3

# IMPORTANTE: adapter-node guarda la build en una carpeta 'build' por defecto,
# no en '.svelte-kit/output' (eso es código intermedio de Vite).
COPY --from=builder /app/build ./build

COPY static ./static
COPY drizzle.config.ts ./
COPY vite.config.ts ./
COPY scripts/db ./scripts/db
COPY drizzle ./drizzle
COPY src/lib/db ./src/lib/db
COPY src/lib/seed ./src/lib/seed
COPY src/lib/utils ./src/lib/utils

RUN mkdir -p /app/data/prod

EXPOSE 4173

# Variables de entorno generales
ENV NODE_ENV=production
ENV DATABASE_URL=./data/prod/local.db

# Variables para SvelteKit adapter-node
ENV PORT=4173
ENV HOST=0.0.0.0
# Estas son la clave para que el CSRF funcione en múltiples dominios detrás del proxy:
ENV PROTOCOL_HEADER=x-forwarded-proto
ENV HOST_HEADER=host

# Ejecuta el servidor Node de producción compilado
CMD ["node", "build/index.js"]
