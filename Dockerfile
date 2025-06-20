# ==> Stage 1: Build Frontend Assets <==
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json ./

# Install project dependencies
RUN npm install

# Copy all source files
COPY . .

# Generate the static build of the React frontend
# This will create a 'dist' folder with optimized assets
RUN npm run build


# ==> Stage 2: Setup Production Server <==
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy dependency definitions from builder stage
COPY --from=builder /app/package.json /app/package-lock.json ./

# Install only production dependencies to keep the image small
# This will skip devDependencies like vite, react, etc.
RUN npm install --omit=dev

# Copy server-related files from builder stage
COPY --from=builder /app/server ./server

# Copy the built frontend assets from the builder stage
# The server will serve these static files
COPY --from=builder /app/dist ./dist

# The backend server runs on port 3001
EXPOSE 3001

# Command to start the production server
# This should run the Express server which serves the API and the built frontend
CMD [ "node", "server/index.js" ] 