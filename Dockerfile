# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Define build arguments for Vite
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Set them as environment variables for the build process
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install || npm install

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
