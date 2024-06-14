# Stage 1: Build the application
FROM node:slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm cache clean --force
RUN npm install

COPY ./ ./
COPY entry.sh ./

# Build the application
RUN npm run build

# Stage 2: Create the production image
FROM node:slim

WORKDIR /app

COPY --from=builder /app .
COPY --chmod=755 entry.sh /entry.sh

EXPOSE 3000

CMD ["/entry.sh"]
