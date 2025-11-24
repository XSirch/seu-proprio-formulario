# Backend Dockerfile
FROM node:22-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production --silent && npm cache clean --force

# Bundle app source
COPY . .

# Expose backend port
EXPOSE 3001

# Environment variables (can be overridden by Docker/Compose)
ENV NODE_ENV=production

# Start command
CMD ["npm", "start"]

