FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Create upload directories
RUN mkdir -p uploads/documents uploads/receipts uploads/photos uploads/temp

EXPOSE 5000

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "server.js"]
