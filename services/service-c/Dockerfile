# Stage 1: Build TypeScript source
FROM node:24-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
# Prune development dependencies so final package size stays minimal
RUN npm prune --production

# Stage 2: Runtime image
FROM node:24-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY package*.json ./
EXPOSE 3002
CMD ["node", "dist/index.js"]
