# Multi-stage production build for AMBOSS Fastify backend
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Non-root user for security
USER node

EXPOSE 4000

CMD ["node", "dist/index.js"]
