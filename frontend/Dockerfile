# ---- Builder stage --------
FROM node:20-alpine AS builder
WORKDIR /app

# Accept API_URL as build argument with default
ARG API_URL=http://localhost:8000
ENV API_URL=${API_URL}

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# ---- Runner stage --------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
