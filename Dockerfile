# ----- Stage 1: Build React frontend -----
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ----- Stage 2: Backend with Prisma + React build -----
FROM node:20-alpine
WORKDIR /app

# Backend dependencies
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/
WORKDIR /app/backend
RUN npm ci --only=production

# Generate Prisma client (must happen after schema is copied)
RUN npx prisma generate

# Copy backend source code
WORKDIR /app
COPY backend/ ./backend/

# Copy React build from stage 1
COPY --from=frontend-build /app/frontend/build ./frontend/build

WORKDIR /app/backend
EXPOSE 3000

# Run migrations on start, then start server
CMD npx prisma migrate deploy && node index.js