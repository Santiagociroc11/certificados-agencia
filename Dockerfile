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

# Install Alpine-specific dependencies, including the lightweight Chromium browser
RUN apk add --no-cache udev ttf-freefont chromium

# Tell Puppeteer to skip downloading Chromium. We're using the one from apk.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set the public URL for the application, can be overridden by Easypanel
ENV PUBLIC_BASE_URL="http://localhost:3001"

# Copy dependency definitions
COPY --from=builder /app/package.json /app/package-lock.json ./

# Install only production dependencies. This will be much faster.
RUN npm install --omit=dev

# Copy the server code and the built frontend from the builder stage
COPY --from=builder /app/server ./server
COPY --from=builder /app/dist ./dist

# Create directories and set correct ownership for the node user.
# This is crucial for allowing the app to write to persistent volumes.
RUN mkdir -p /app/server/data && \
    mkdir -p /app/server/generated && \
    chown -R node:node /app/server/data && \
    chown -R node:node /app/server/generated

EXPOSE 3001

# Start the server
CMD [ "node", "server/index.js" ] 