# syntax=docker/dockerfile:1

FROM node:20-bullseye-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci && npm install bcryptjs@^3.0.2 --no-save

FROM deps AS dev
ENV NODE_ENV=development
COPY . .
CMD ["npm", "run", "dev"]

FROM deps AS builder
ENV NODE_ENV=production
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY prisma ./prisma

EXPOSE 3000
CMD ["npm", "run", "start"]
