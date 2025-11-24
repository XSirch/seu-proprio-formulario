# Fullstack (frontend + backend) Dockerfile

# 1) Build frontend with Vite
FROM node:22-alpine AS frontend-build

WORKDIR /app

# Install frontend dependencies
COPY package.json package-lock.json* ./
RUN npm install --silent && npm cache clean --force

# Copy source and build
COPY . .

# API base URL for production: same host, /api prefix
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# 2) Build backend + final runtime image
FROM node:22-alpine

WORKDIR /usr/src/app

# Install backend dependencies
COPY server/package.json server/package-lock.json* ./
RUN npm install --production --silent && npm cache clean --force

# Copy backend source
COPY server/. .

# Copy built frontend into /usr/src/app/public
COPY --from=frontend-build /app/dist ./public

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "index.js"]

