# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/Frontend
COPY Frontend/package*.json ./
RUN npm ci
COPY Frontend/ ./
RUN npm run build

# Stage 2: Backend with Prisma + React build
FROM node:20-alpine
WORKDIR /app

COPY Backend/package*.json ./Backend/
COPY Backend/prisma ./Backend/prisma/
WORKDIR /app/Backend
RUN npm ci --only=production

RUN npx prisma generate

WORKDIR /app
COPY Backend/ ./Backend/

COPY --from=frontend-build /app/Frontend/build ./Frontend/build

WORKDIR /app/Backend
EXPOSE 3000

CMD npx prisma migrate deploy && node index.js