# Build stage for React frontend
FROM node:18-alpine as frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --only=production

# Copy server files
COPY src/server/ ./src/server/
COPY --from=frontend-build /app/dist ./dist

# Create uploads directory for file storage
RUN mkdir -p uploads

# Expose port
EXPOSE 4000

# Start the server
CMD ["node", "src/server/server.js"]
