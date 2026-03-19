FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Prisma CLI needs package.json to locate binary targets
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

# Run migrations first, then start the server
# prisma migrate deploy is idempotent — safe to run on every boot
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
