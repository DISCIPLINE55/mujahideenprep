# Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Define build arguments for Vite
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Set them as environment variables for the build process
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (including vite)
RUN npm install

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Copy everything for simplicity in this hybrid build
COPY --from=build /app ./

# Expose port 8080
ENV PORT=8080
EXPOSE 8080

# Serve the app using vite preview
# This correctly handles TanStack Start SSR
CMD ["npm", "run", "preview", "--", "--port", "8080", "--host", "0.0.0.0"]
