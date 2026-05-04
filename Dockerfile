# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install a simple static file server
RUN npm install -g serve

# Copy built files from build stage
COPY --from=build /app/dist ./dist

# Expose port (Cloud Run uses 8080 by default)
EXPOSE 8080

# Serve the built app
CMD ["serve", "-s", "dist", "-l", "8080"]
