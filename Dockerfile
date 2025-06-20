# ==> Stage 1: Build Frontend Assets <==
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency definitions first to leverage Docker cache
COPY package.json package-lock.json ./

# Install all dependencies for building the frontend
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the frontend
RUN npm run build


# ==> Stage 2: Setup Production Server <==
FROM node:18-alpine AS production

WORKDIR /app

# Install dependencies for node-canvas (used by Fabric.js on the server)
RUN apk add --no-cache build-base cairo-dev pango-dev libjpeg-turbo-dev giflib-dev

# Environment variables will be set by Easypanel
# No default values to ensure proper configuration

# Copy dependency definitions
COPY --from=builder /app/package.json /app/package-lock.json ./

# Install only production dependencies. This will be much faster.
RUN npm install --omit=dev

# Copy the server code and the built frontend from the builder stage
COPY --from=builder /app/server ./server
COPY --from=builder /app/dist ./dist

# Copy fonts for node-canvas
COPY --from=builder /app/server/assets/fonts /app/server/assets/fonts

# Create directories and set correct ownership for the node user.
# This is crucial for allowing the app to write to persistent volumes.
RUN mkdir -p /app/server/data && \
    mkdir -p /app/server/generated && \
    chown -R node:node /app/server/data && \
    chown -R node:node /app/server/generated

EXPOSE 3001

# Start the server
CMD [ "node", "server/index.js" ] 