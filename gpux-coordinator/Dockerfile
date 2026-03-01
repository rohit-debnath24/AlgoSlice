# Use Node.js 20 LTS as the base image
FROM node:20-slim AS build

# Install OpenSSL (required for Prisma)
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Compile TypeScript to JavaScript
RUN npx tsc

# Final production image
FROM node:20-slim AS runner

RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# Copy only the compiled code and production dependencies
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma

EXPOSE 3000

# Start the server using node
CMD ["node", "dist/server.js"]
