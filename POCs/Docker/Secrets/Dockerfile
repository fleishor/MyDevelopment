# Build stage
FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . ./
RUN npm run build

# Runtime stage
FROM node:24-alpine AS runner
WORKDIR /app

COPY package.json ./
RUN npm install

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]
