# ─── Stage 1: deps ────────────────────────────────────────────────────────────
FROM node:20-slim AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# ─── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-slim

WORKDIR /app

# Install Docker CLI only (no daemon) so app can call `docker run` on the host
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg lsb-release \
  && mkdir -p /etc/apt/keyrings \
  && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
     https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
     > /etc/apt/sources.list.d/docker.list \
  && apt-get update && apt-get install -y --no-install-recommends docker-ce-cli \
  && rm -rf /var/lib/apt/lists/*

# Copy production deps + source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Use the same temp directory that the HOST docker daemon can reach via the mounted socket
ENV NODE_ENV=production

EXPOSE 8800

CMD ["node", "server/index.js"]
