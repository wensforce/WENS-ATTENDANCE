# ----- Stage 1: Build React frontend (Vite) -----
FROM node:20-alpine AS frontend-build
WORKDIR /app/Frontend

# Receive all VITE_ build args
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_FIREBASE_VAPID_KEY
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID

# Make them available to vite during build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
ENV VITE_FIREBASE_VAPID_KEY=$VITE_FIREBASE_VAPID_KEY
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID

# Install deps and build
COPY Frontend/package*.json ./
RUN npm ci
COPY Frontend/ ./
RUN npm run build

# ----- Stage 2: Backend with Prisma + serve React -----
FROM node:20-alpine
WORKDIR /app

# Backend dependencies
COPY Backend/package*.json ./Backend/
COPY Backend/prisma ./Backend/prisma/
WORKDIR /app/Backend
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy backend source
WORKDIR /app
COPY Backend/ ./Backend/

# Copy Vite build output (Vite uses 'dist', not 'build')
COPY --from=frontend-build /app/Frontend/dist ./Frontend/dist

WORKDIR /app/Backend
EXPOSE 3000

# Run migrations then start server
CMD npx prisma migrate deploy && node index.js