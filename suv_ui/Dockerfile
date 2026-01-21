# ---- Builder stage --------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Accept API_URL as build argument with default
ARG API_URL=http://localhost:8000
ENV API_URL=${API_URL}

RUN npm run build

# ---- Runner stage ---------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3030
CMD ["node", "server.js"]
