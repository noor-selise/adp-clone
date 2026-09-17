# Blocks Release image for Next.js app under web/ (multi-stage, standalone)
FROM node:20.11.0-alpine AS deps
WORKDIR /app
COPY web/package.json web/package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:20.11.0-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY web/ .

ARG ci_build=dev
ENV ci_build=$ci_build
ARG NEXT_PUBLIC_BLOCKS_PROJECT_KEY
ARG NEXT_PUBLIC_BLOCKS_API_URL
ARG NEXT_PUBLIC_BLOCKS_APP_DOMAIN
ARG NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID
ARG NEXT_PUBLIC_BLOCKS_OIDC_URL
ARG NEXT_PUBLIC_BLOCKS_OIDC_SCOPE
ENV NEXT_PUBLIC_BLOCKS_PROJECT_KEY=$NEXT_PUBLIC_BLOCKS_PROJECT_KEY \
    NEXT_PUBLIC_BLOCKS_API_URL=$NEXT_PUBLIC_BLOCKS_API_URL \
    NEXT_PUBLIC_BLOCKS_APP_DOMAIN=$NEXT_PUBLIC_BLOCKS_APP_DOMAIN \
    NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID=$NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID \
    NEXT_PUBLIC_BLOCKS_OIDC_URL=$NEXT_PUBLIC_BLOCKS_OIDC_URL \
    NEXT_PUBLIC_BLOCKS_OIDC_SCOPE=$NEXT_PUBLIC_BLOCKS_OIDC_SCOPE \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build:${ci_build}

FROM node:20.11.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8083
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && mkdir -p /app/log

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8083
CMD ["node", "server.js"]
