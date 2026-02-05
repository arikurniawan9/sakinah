# Use a Node.js 20 LTS image as the base
FROM node:20-alpine AS base

# 1. Pruning and Dependency Installation
FROM base AS deps
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN 
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; 
  elif [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; 
  else npm install --frozen-lockfile; 
  fi

# 2. Builder Stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client and run Next.js build
# We use the vercel-build script which includes prisma generate and migrate deploy
# Note: For production, prisma migrate deploy should ideally be run in a separate step or a dedicated migration job,
# or as part of an entrypoint script that runs migrations before starting the app.
# For simplicity in this Dockerfile, we're following the vercel-build approach.
RUN npx prisma generate
RUN npm run build

# 3. Runner Stage
FROM base AS runner
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV production
# Set the port the application should listen on
ENV PORT 3000

# Copy necessary files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/utils ./utils

# Expose the port
EXPOSE 3000

# Command to run the application
CMD ["node", "server.js"]
